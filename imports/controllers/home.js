import  { Meteor }          from 'meteor/meteor';
import  { Template }        from 'meteor/templating';
import  { Rooms }           from '../models/rooms';
import  { RoomUsers }       from '../models/users';

Template.body.onCreated(function bodyOnCreated(){
});

Template.Home.events({
    'submit #new-room'(event){
        event.preventDefault();

        const target        = event.target;
        const username      = target.username.value;

        Meteor.call('rooms.insert', username, (error, result) => {
            if(result) {
                const id        = result;
                const base_url  = window.location.origin;

                // Stores a authenticated session variable (persistent + automatic deletion)
                if(Session.get('myName') != username) {
                    Session.update('myName', username);
                }else{
                    Session.setAuth('myName', username);
                }

                // Insert user into the room
                Meteor.call('room_users.insert', id, username, 1, (error, result) => {
                });

                window.location.href = base_url + '/room/'+id+'';
            }

            if(error){
                // Do something amazing when there's an error!
            }
        });
    }
});