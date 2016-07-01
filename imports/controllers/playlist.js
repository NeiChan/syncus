import  { Meteor }          from 'meteor/meteor';
import  { Template }        from 'meteor/templating';
import  { Playlist }        from '../models/playlists'
import  { YT }              from '../functions/youtube';

Template.playlist.onCreated( () => {
});

Template.playlist.helpers({
    getPlaylist() {
        return Playlist.find({roomId: "" + Template.instance().data.roomId + ""});
    },

    totalVideos() {
        return Playlist.find({roomId: "" + Template.instance().data.roomId + ""}).count();
    }
});


Template.playlist.events({
    'click .removeFromPlaylist' : (e) => {
        let roomId  = Template.instance().data.roomId;
        let videoID = e.target.getAttribute('yt-video');

        Meteor.call('playlist.delete', roomId, videoID, (error, result) => {
            if(error){
                // console.log(error);
            }

            if(result){
                // console.log(result);
            }
        });
    } 
});