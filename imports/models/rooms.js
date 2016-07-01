import  { Meteor}   from 'meteor/meteor';
import  { Mongo }   from 'meteor/mongo';

export const Rooms = new Mongo.Collection('rooms');

/**
 * Model for building up a Room
 */

if(Meteor.isServer){
    Meteor.methods({
        'rooms.insert'(username){
            // Check if username is filled in...
            if(username != '') {
                // Valid username means creating a Room.
                return Rooms.insert({
                    createdAt: new Date(),
                    owner: username,
                    currentVideoId: "x-u1wHZLezc",
                    videoTime: 0.00,
                    totalTime: 0.00,
                    isPlaying: false
                });
            }else{
                // Username was not filled in.
                throw new Meteor.Error('Username not filled in.');
            }
        },

        'rooms.updateVideoTime'(roomId, time){
            return Rooms.update(roomId, {$set: { videoTime: time }});
        },

        'rooms.totalVideoTime'(roomId, time){
            return Rooms.update(roomId, {$set: { totalTime: time }});
        },

        'rooms.pauseVideo'(roomId, playing){
            return Rooms.update(roomId, {$set: { isPlaying: playing }});
        },

        'rooms.updateVideoId'(roomId, videoId){
            return Rooms.update(roomId, {$set: { currentVideoId: videoId }});
        }
    })
}