import  { Meteor}           from 'meteor/meteor';
import  { Mongo }           from 'meteor/mongo';
import  { Accounts }        from 'meteor/accounts-base';

export const RoomUsers = new Mongo.Collection('room_users');

/**
 * Model for building up a user
 */

if(Meteor.isServer) {
    Meteor.methods({
        'room_users.insert'(room_id, username, usertype){
            // Check room_id
            if (room_id) {
                return RoomUsers.insert({
                    roomId: room_id,
                    user: username,
                    userType: usertype
                });
            } else {
                throw new Meteor.Error('Room id was not given.');
            }
        },

        'room_users.delete'(room_id, username){
            // Check room_id
            if (room_id) {
                return RoomUsers.remove({
                    roomId: room_id,
                    user: username,
                });
            } else {
                throw new Meteor.Error('rRoom id was not given');
            }
        }
    });
}