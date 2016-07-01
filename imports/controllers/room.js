import  { Meteor }          from 'meteor/meteor';
import  { Template }        from 'meteor/templating';

import  { Playlist }        from '../models/playlists';
import  { Rooms }           from '../models/rooms';
import  { RoomUsers }       from '../models/users';

let player;
let done = false;
let currentRoom;
let updateSlider;

/**
 * @TemplateOnRendered
 *
 * Description : Register external scripts.
 */
Template.Room.onRendered( () => {
    $.getScript("https://www.youtube.com/iframe_api");
});


/**
 * @TemplateOnCreated
 */
Template.Room.onCreated( () => {
    /**
     * Find information of the room, put it into the session
     * The session will be helpfull in the youtube functions and helpers
     */
    const roomId = Template.instance().data.roomId;
    currentRoom = Rooms.findOne({_id: roomId});
    Session.set('roomId', roomId);
    let myName = Session.get('myName');

    // Always clean up search results.
    Session.set("search-results", "");

    /**
     * client side uses Tracker autorun for reactive changes.
     *
     */
    Tracker.autorun( () => {
        const nextToPlay = Playlist.findOne({roomId: "" + roomId + ""}, {sort: {added: 0}});
        let sessionVideo = Session.get("nextVideo");

        if(nextToPlay == undefined) {
            //
        }else{
            if (nextToPlay && nextToPlay["videoId"] == sessionVideo && sessionVideo["videoId"]) {
                // session equals to current video.
                // console.log("session equals current video");
            } else {
                // put new video into the waiting list.
                Session.set("nextVideo", nextToPlay);
                // console.log("the next video does not equal to the session. so session has been updated");
            }
        }
    });

    /**
     * @NewUsersInputScreen
     *
     * Description : When users come into the room the code below will ask for a name.
     */
    if (myName) {
        // If Name Found then do nothing.
    } else {
        swal({
                title: "Hi !, what is your name ?",
                text: "This will be your name seen by people in the room.",
                type: "input",
                animation: "slide-from-top",
                allowOutsideClick: false,
                allowEscapeKey: false,
                showCancelButton: false,
                closeOnConfirm: false,

            },
            (value) => {
                if (value) {
                    swal("Thank you!", "Your name is : " + value + "\n You can now join the room!", "success");

                    Session.setAuth('myName', value);

                    Meteor.call('room_users.insert', roomId, value, 2, (error, result) => {});
                } else {
                    swal.showInputError("Please write a name.");
                    return false;
                }
            }
        );
    }
});


/**
 * @TemplateHelpers
 */

Template.Room.helpers({
    getUsers() {
        return RoomUsers.find({roomId: "" + Template.instance().data.roomId + ""});
    },

    isAdmin() {
        return RoomUsers.findOne({roomId: "" + Template.instance().data.roomId + "", user: "" + Session.get('myName') + "", userType: 1 });
    },

    currentUser(user) {
        if(user == Session.get('myName')){
            return true;
        }else{
            return false;
        }
    },

    getConnectedUsers() {
        return Meteor.users.find({ "status.online": true });
    },

    getSearchResults() {
        return Session.get("search-results");
    }
});


/**
 * @HelperRegister
 *
 * Description : Register helpers for using it in the view.
 */
Template.registerHelper('currentVideoTime', () => {
   if(player && player.getCurrentTime()){
       return Meteor.youtubeFunctions.formatTime(player.getCurrentTime());
   }
});

Template.registerHelper('totalVideoTime', () => {
   if(player && player.getCurrentTime()) {
       return Meteor.youtubeFunctions.formatTime(player.getDuration());
   }
});


/**
 * @TemplateEvents
 */
Template.Room.events({
    'keyup .search-input' : (e, template) => {

        let textOutput = e.target.value;

        if(textOutput == "")
        {
            Session.set("search-results", "");
        }else{
            // Put into a session and use it in helpers.
            let search = Meteor.youtubeFunctions.searchVideos(textOutput);
        }
    },

    'click .addToPlaylist' : (e) => {
        const   roomId  = Template.instance().data.roomId;
        let     videoID = e.target.getAttribute('yt-video');
        let     image   = e.target.getAttribute('yt-image');
        let     title   = e.target.getAttribute('yt-title');

        Meteor.call('playlist.insert', roomId, videoID, image, title,  (error, result) => {
            if(error){
                console.log(error);
            }

            if(result){
                console.log(result);
            }
        });
    },

    'click .playBtn' : (e) => {
        this.playVideo();
    },

    'click .pauseBtn' : (e) => {
        this.pauseVideo();
    },

    'click .skipBtn' : (e) => {
        this.skipVideo();
    }
});


window.onbeforeunload = function () {
    // Remove the user from the room
    Meteor.call('room_users.delete', Session.get('roomId'), Session.get('myName'));
}

/**
 * @YoutubeIFrameAPI
 *
 * Description : Youtube Player is builded up here including functions for the player and time slider.
 *
 * Functions :
 * @onYoutubeIFrameAPIReady
 * When YoutubeAPI is ready, create the player and load current video from
 * the current room, builds up the time slider and starts observering the room for changes
 *
 * @onPlayerReady
 * When the player is ready check if the room is playing a video if it is. play the video right away.
 * 
 * @onPlayerStateChange
 * When the Player has ended the video. Start the next video by using the skipVideo function.
 *
 */
window.onYouTubeIframeAPIReady = function() {
    // Used for using observer
    const currentRoom = Rooms.find({_id: Session.get('roomId')});

    // Used for getting videoId
    const findOneRoom = Rooms.findOne({_id: Session.get('roomId')});

    player = new YT.Player('player', {
        height: '400',
        width: '100%',
        videoId: findOneRoom.currentVideoId,
        playerVars: { autoplay: 0, controls: 0, showinfo: 0, iv_load_policy: 3 },
        events: {
            'onReady': onPlayerReady,
            'onStateChange': onPlayerStateChange
        }
    });

    /**
     * Initiate the slider and put a interval when it's created or stopped.
     */
    $('#player-time').slider({
        range: 'min',
        min: 0,
        max: 100,

        create: (e, data) => {
            updateSlider = Meteor.setInterval(sliderUpdate, 500);
        },

        // Called when slider is moved
        stop: (e, data) => {
            Meteor.clearInterval(updateSlider);
            Meteor.call('rooms.updateVideoTime', Session.get('roomId'), data.value);
            updateSlider = Meteor.setInterval(sliderUpdate, 500);
        }
    });

    /**
     * Observe the room
     */
    currentRoom.observe({
        changed: (newState, oldState) => {
            // oldstate videoid is not equal to newstate videoid
            if(oldState.currentVideoId != newState.currentVideoId){
                // videoid has changed
                this.loadVideoById(newState.currentVideoId);
                if(!newState.isPlaying){
                    player.pauseVideo();
                }

            // oldstate and newstate are not equal execute the following
            }else if(oldState.isPlaying != newState.isPlaying){
                // oldstate is false and newstate is true
                if(!oldState.isPlaying && newState.isPlaying){
                    player.playVideo();
                    console.log("oldstate playing is false and newstate is true");
                }else if(oldState.isPlaying && !newState.isPlaying) {
                    player.pauseVideo();
                    console.log("oldstae is true and newstate is false");
                }

            // -2 fixes the issue of freeze
            }else if(oldState.videoTime > newState.videoTime || oldState.videoTime < newState.videoTime - 2) {
                Meteor.clearInterval(updateSlider);
                this.seekToVideo(newState.videoTime);
                updateSlider = Meteor.setInterval(sliderUpdate, 500);
            }
        }
    });
};

window.onPlayerReady = (event) => {
    if(currentRoom.isPlaying)
    {
        this.playVideo();
    }
};

window.onPlayerStateChange = (event) => {
    if (event.data == YT.PlayerState.PLAYING && !done) {
        // setTimeout(stopVideo, 6000);
        // done = true;
    }

    if (event.data == YT.PlayerState.PAUSED) {

    }

    if (event.data == YT.PlayerState.ENDED){
        this.skipVideo();
    }
};

loadVideoById = (id) => {
    // video_id, startseconds, quality
    player.loadVideoById(id, 0, "large");
};

playVideo = () => {
    player.playVideo();
    Meteor.call('rooms.pauseVideo', Session.get('roomId') , true);
};

pauseVideo = () => {
    player.pauseVideo();
    Meteor.call('rooms.pauseVideo', Session.get('roomId') , false);
}

skipVideo = () => {
    let nextToPlay = Session.get("nextVideo");
    loadVideoById(nextToPlay["videoId"]);

    Meteor.call('playlist.delete', nextToPlay["roomId"], nextToPlay["videoId"], (error, result) => {
        if(error){
            console.log(error);
        }

        if(result){
            console.log(result);
        }
    });
    
    Meteor.call('rooms.updateVideoId', nextToPlay["roomId"], nextToPlay["videoId"]);
}

stopVideo = () => {
    player.stopVideo();
};

getVideoTotalTime = () => {
    return player.getDuration();
}

getVideoCurrentTime = () => {
    return player.getCurrentTime();
}

seekToVideo = (time) => {
    return player.seekTo(time);
}

/**
 * The slider will be updated using this piece of code.
 */
sliderUpdate = () => {
    // The if function is used to prevent undefined.
    if (player && player.getCurrentTime) {
        if (currentRoom.owner == Session.get('myName')) {
            Meteor.call('rooms.updateVideoTime', Session.get('roomId'), player.getCurrentTime());
        }
        
        const playerTimeId = $('#player-time');
        playerTimeId.slider("option", "value", player.getCurrentTime());
        playerTimeId.slider("option", "max", player.getDuration());

        // If the value of the current room is bigger then the current time of the video you are watching. Seek to the location
        if (currentRoom.videoTime > player.getCurrentTime() + 3) {
            // console.log("currentRoom time is bigger then the player currenttime");
            this.seekToVideo(currentRoom.videoTime + 0.5);
            // If the room is not playing pause the video
            if (!currentRoom.isPlaying) {
                this.pauseVideo();
            }
        }
    }
}