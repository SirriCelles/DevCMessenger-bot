'use strict';
require("dotenv").config();
import { resolve } from "path";
import request from "request";
import {waitAndPrint} from "../controllers/responseController";


const fs = require('fs');
let rawdata = fs.readFileSync('response.json');
let data = JSON.parse(rawdata);




let postWebhook = (req, res) =>{
    // Parse the request body from the POST
    let body = req.body;

    // Check the webhook event is from a Page subscription
    if (body.object === 'page') {

        // Iterate over each entry - there may be multiple if batched
        body.entry.forEach(function(entry) {

            // Gets the body of the webhook event
            let webhook_event = entry.messaging[0];
            console.log(webhook_event);


            // Get the sender PSID
            let sender_psid = webhook_event.sender.id;
            console.log('Sender PSID: ' + sender_psid);

            // Check if the event is a message or postback and
            // pass the event to the appropriate handler function
            if (webhook_event.message) {
                handleMessage(sender_psid, webhook_event.message);
            } else if (webhook_event.postback) {
                handlePostback(sender_psid, webhook_event.postback);
            }

        });

        // Return a '200 OK' response to all events
        res.status(200).send('EVENT_RECEIVED');

    } else {
        // Return a '404 Not Found' if event is not from a page subscription
        res.sendStatus(404);
    }
};

let getWebhook = (req, res) => {
    // Your verify token. Should be a random string.
    let VERIFY_TOKEN = process.env.MY_VERIFY_FB_TOKEN;

    // Parse the query params
    let mode = req.query['hub.mode'];
    let token = req.query['hub.verify_token'];
    let challenge = req.query['hub.challenge'];

    // Checks if a token and mode is in the query string of the request
    if (mode && token) {

        // Checks the mode and token sent is correct
        if (mode === 'subscribe' && token === VERIFY_TOKEN) {

            // Responds with the challenge token from the request
            console.log('WEBHOOK_VERIFIED');
            res.status(200).send(challenge);

        } else {
            // Responds with '403 Forbidden' if verify tokens do not match
            res.sendStatus(403);
        }
    }
};


// Handles messaging_postbacks events
function handlePostback(sender_psid, received_postback) {
    let response;
  
  // Get the payload for the postback
  let payload = received_postback.payload;

  // Set the response based on the postback payload
  if (payload === 'yes') {
    response = { "text": yes_res }
  } else if (payload === 'no') {
    response = { "text": no_res }
  }
  // Send the message to acknowledge the postback
  callSendAPI(sender_psid, response);

}

// Sends response messages via the Send API
function callSendAPI(sender_psid, response) {
    // Construct the message body
  let request_body = {
    "recipient": {
      "id": sender_psid
    },
    "message": {"text": response }
  }

  // Send the HTTP request to the Messenger Platform
  request({
    "uri": "https://graph.facebook.com/v9.0/me/messages",
    "qs": { "access_token": process.env.DEVC_CHATBOT_PAGE_TOKEN },
    "method": "POST",
    "json": request_body
  }, (err, res, body) => {
    if (!err) {
      console.log('message sent!');
      console.log(`Message Sent: ${response}`);
    } else {
      console.error("Unable to send message:" + err);
    }
  }); 
  
}


function firstTrait(nlp, name) {
    return nlp && nlp.entities && nlp.traits[name] && nlp.traits[name][0];
}

function transform(message) {
    return message.toLowerCase();
}

function processWait(values = [], time) {
    if(values.length > 0) {
     waitAndPrint(
         function(){
             callSendAPI(sender_psid, values[0]);
             
         }, time
     ).then(
         () => {
             let temp = [...values];

             processWait(temp.slice(1), time)
         }
     )
    } 
 }

function handleMessage(sender_psid, message) {
    //handle message for react, like press like button
    // id like button: sticker_id 369239263222822    
    let res = transform(message.text);
    const resValues = [
        "Hi there! Welcome to DevC Chat page",
        "I'm Deve! How can I assist You?",
        "Please select an option below."
    ];

    const greeting = firstTrait(message.nlp, "wit$greetings");
    // Specific replies
    if (greeting && greeting.confidence > 0.8) {
        processWait(resValues, 1000);
    } 

    let entitiesArr = ["wit$thanks", "wit$bye" ];
    let entityChosen = "";
    entitiesArr.forEach((name) => {
        let entity = firstTrait(message.nlp, name);
        if (entity && entity.confidence > 0.8) {
            entityChosen = name;
        }
    });

    if(entityChosen === "wit$thanks"){
           //send thanks message
           callSendAPI(sender_psid,`You 're welcome!`);
       }
    else if(entityChosen === "wit$bye"){
            //send bye message
            callSendAPI(sender_psid, goobyeRes);
        }
    // else if(entityChosen === "") {
    //     // default
    //     callSendAPI(sender_psid, "Am Sorry I can't process this information right now. Please select another option from the list");
    // }


    

    // if( message && message.attachments && message.attachments[0].payload){
    //     callSendAPI(sender_psid, data.thank_you);
    //     callSendAPIWithTemplate(sender_psid);`
    //     return;
    // }

    const goobyeRes = {
        "message":{
            "attachment": {
              "type": "template",
              "payload": {
                 "template_type": "media",
                 "elements": [
                    {
                       "media_type": "video",
                       "attachment_id": "../public/images/goodbye.gif",
                       "buttons": [
                        {
                           "type": "wtext",
                           "url": "none",
                           "title": "Thanks For Visiting!!",
                        }
                       ]
                    }
                 ]
              }
            }
        }
    }

    let callSendAPIWithTemplate = (sender_psid) => {
        // document fb message template
        // https://developers.facebook.com/docs/messenger-platform/send-messages/templates
        let body = {
            "recipient": {
                "id": sender_psid
            },
            "message": {
                "attachment": {
                    "type": "template",
                    "payload": {
                        "template_type": "generic",
                        "elements": [
                            {
                                "title": "Want to build sth awesome?",
                                "image_url": "https://www.nexmo.com/wp-content/uploads/2018/10/build-bot-messages-api-768x384.png",
                                "subtitle": "Watch more videos on my youtube channel ^^",
                                "buttons": [
                                    {
                                        "type": "web_url",
                                        "url": "https://bit.ly/subscribe-haryphamdev",
                                        "title": "Watch now"
                                    }
                                ]
                            }
                        ]
                    }
                }
            }
        };
    
        request({
            "uri": "https://graph.facebook.com/v6.0/me/messages",
            "qs": { "access_token": process.env.DEVC_CHATBOT_PAGE_TOKEN },
            "method": "POST",
            "json": body
        }, (err, res, body) => {
            if (!err) {
                // console.log('message sent!')
            } else {
                console.error("Unable to send message:" + err);
            }
        });
    };
}

module.exports = {
    postWebhook: postWebhook,
    getWebhook: getWebhook
}

