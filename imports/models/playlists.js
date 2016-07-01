import  { Meteor}   from 'meteor/meteor';
import  { Mongo }   from 'meteor/mongo';

export const Playlist = new Mongo.Collection('rooms_playlist');

/**
 * Model for building up a playlist
 */

if(Meteor.isServer){
    
    Meteor.methods({
        'playlist.insert'(room_id, video_id, img, r_title){
            if (room_id && video_id) {
                return Playlist.insert({
                    roomId  : room_id,
                    videoId : video_id,
                    image   : img,
                    title   : r_title,
                    added   : new Date()
                });
            } else {
                throw new Meteor.Error('Room & Video id was not given.');
            }
        },

        'playlist.delete'(room_id, video_id){
            if (room_id && video_id) {
                return Playlist.remove({
                    roomId  : room_id,
                    videoId : video_id
                });
            } else {
                throw new Meteor.Error('Room & Video id was not given.');
            }
        }
    });
}