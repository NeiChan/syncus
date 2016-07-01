import  { Meteor }          from 'meteor/meteor';
import  { Rooms }           from '../models/rooms';

// Route to homepage
Router.route('/', function () {
    this.render('Home');
});

// Route to Room
Router.route('/room/:_id', function() {
    var id = Rooms.findOne({_id: this.params._id});

    // Sending data to the Room.
    if(id) {
        this.render('Room', {
            data: {
                roomId : this.params._id
            }
        });
    }else{
        this.render('Error');
    }
});