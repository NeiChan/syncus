/**
 * Meteor Youtube Helper class
 * Description: Functions to build up Youtube in Meteor
 * Author : Wesley Cheung
 *
 */

import { HTTP } from "meteor/http";

const ACCESS_TOKEN = "AIzaSyAo48k4li_gEZBGrJMhGpu443mpbX3lOmo"

Meteor.youtubeFunctions = {
    
    searchVideos : (text) => {
        let url = "https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=25&q="+ text +" &key="+ ACCESS_TOKEN +"";
        let filteredResults = [];

        let options = {
            'headers' : {
                'Content-Type': 'application/json'
            }
        };

        HTTP.get(url , options , function( error, response ) {

            if ( error ) {
                throw Meteor.Error("Couldn't find what you wanted to search");
            } else {
                let results = response["data"]["items"];

                results.forEach( (value) => {
                    //console.log(value);

                    filteredResults.push({
                        "videoId"       : value["id"]["videoId"],
                        "title"         : value["snippet"]["title"],
                        "description"   : value["snippet"]["description"],
                        "image"         : value["snippet"]["thumbnails"]["medium"]["url"]
                    });
                });


                // Instead of a return set the session. For some reason HTTP.get is blocking a return call to the template events.
                Session.set('search-results', filteredResults);
            }
        });
    },

    formatTime : (time) => {
        time = Math.round(time);
    
        let minutes = Math.floor(time / 60),
            seconds = time - minutes * 60;
    
        return minutes + ":" + seconds;
    }
}