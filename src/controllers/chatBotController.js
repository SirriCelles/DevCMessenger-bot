'use strict';
require("dotenv").config();
import { resolve } from "path";
import request from "request";


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

 // Send the HTTP request to the Messenger Platform anyform
 function callSendAPIAny(sender_psid, response) {
    let request_body = {
      "recipient": {
        "id": sender_psid
      },
      "message": response
    }
    request({
      "uri": "https://graph.facebook.com/v2.6/me/messages",
      "qs": { "access_token": process.env.DEVC_CHATBOT_PAGE_TOKEN },
      "method": "POST",
      "json": request_body
    }, (err, res, body) => {
      if (!err) {
        console.log('message sent!')
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

const byeResponse = {
    "attachment": {
      "type": "template",
      "payload": {
        "template_type": "generic",
        "elements": [
            {
          "title": "Thanks for visiting!!",
          "subtitle": "Fairwell till next time",
          "image_url": "https://miro.medium.com/max/1875/1*xJb0gDyM5kwN3oJht--tNg.jpeg",
          "buttons": [
            {
              "type":"text",
              "title":"byb bye"
            }           
            ]
        }]
      }
    }
}

const botOptions = {
    "attachment":{
        "type":"template",
        "payload":{
          "template_type":"generic",
          "elements":[
             {
              "title":"Upcoming Events",
              "image_url":"https://zepstra.com/wp-content/uploads/2018/01/Zepstra-CEO-Franklin-Fotang-at-Facebook-Developers-Circle-Buea-1080x550.jpg",
              "subtitle":"View Devc upcoming events",
              "default_action": {
                "type": "web_url",
                "url": "https://www.activspaces.com/programs/community/groups/facebook-developers-circle-buea/",
                "webview_height_ratio": "tall",
              },
              "buttons":[
                {
                  "type":"web_url",
                  "url":"https://www.activspaces.com/programs/community/groups/facebook-developers-circle-buea/",
                  "title":"View More"
                }           
              ]      
            },
            {
                "title":"DevC Games",
                "image_url":"https://i1.wp.com/www.afrohustler.com/wp-content/uploads/2019/12/67578380_2342835202466229_8432976811758977024_o.jpg?resize=800%2C533&ssl=1",
                "subtitle":"Join the game and win awesome rewards!",
                "default_action": {
                  "type": "web_url",
                  "url": "https://petersfancybrownhats.com/view?item=103",
                  "webview_height_ratio": "tall",
                },
                "buttons":[
                  {
                    "type":"web_url",
                    "url":"https://www.activspaces.com/programs/community/groups/facebook-developers-circle-buea/",
                    "title":"Check out"
                  }            
                ]      
            },
            {
                "title":"Learning",
                "image_url":"https://miro.medium.com/max/875/1*RUlaYnEKIq4W1wXhaV8IPw.jpeg",
                "subtitle":"Looking to learn something New?",
                "default_action": {
                  "type": "web_url",
                  "url": "https://petersfancybrownhats.com/view?item=103",
                  "webview_height_ratio": "tall",
                },
                "buttons":[
                  {
                    "type":"web_url",
                    "url":"https://www.activspaces.com/programs/community/groups/facebook-developers-circle-buea/",
                    "title":"View Resources"
                  }            
                ]      
              }

          ]
        }
    }
}

const godbyeGif = {
    "attachment": {
        "type": "template",
        "payload": {
            "template_type": "generic",
            "elements": [
            {
                "url":"../public/images/goodbye.gif",
                "subtitle":"View Devc upcoming events",
                "buttons":[
                    {
                        "type": "wtext",
                        "url": "none",
                        "title": "Thanks For Visiting!!",
                    }        
                ]      
            }]
        }
    }
}


function handleMessage(sender_psid, message) {
    //handle message for react, like press like button
    // id like button: sticker_id 369239263222822    
    let res = transform(message.text);

    const greeting = firstTrait(message.nlp, "wit$greetings");
    let entitiesArr = ["wit$thanks", "wit$bye" ];
    let entityChosen = "";
    callSendAPI(sender_psid, "Hi there too");
    
    // Specific replies
    if (message.text) {
        callSendAPI(sender_psid, "hello")
        let res = transform(message.text);
        if (greeting && greeting.confidence > 0.8) {
            callSendAPI(sender_psid, "Hi there! I'm Deve!. Welcome to DevC Chat page how can I assist You,");
                setTimeout(function() {
                    callSendAPI(sender_psid, "Please select an option below");
                } ,3000);
        } 
        if (res === "options") {
            callSendAPIAny(sender_psid, botOptions);
        }
        if(res === "hi" || res === "hello") {
            callSendAPI(sender_psid, "Hi there! I'm Deve!. Welcome to DevC Chat page how can I assist You,");
                setTimeout(function() {
                    callSendAPI(sender_psid, "Please select an option below");
                } ,3000);
        }


        entitiesArr.forEach((name) => {
            let entity = firstTrait(message.nlp, name);
            if (entity && entity.confidence > 0.8) {
                entityChosen = name;
            }
        });

        if(entityChosen === "") {
            callSendAPI(sender_psid, `Am Sorry I can't process this information right now. 
            The bot is needed more training, try to say "thanks a lot" or "hi" or "options" to the bot.`);
        }
        else {
            
            if(entityChosen === "wit$thanks"){
                callSendAPI(sender_psid,`You 're welcome!`);
                callSendAPIAny(sender_psid, godbyeGif);
            }
            if(entityChosen === "wit$bye"){
                callSendAPIAny(sender_psid, byeRresponse);
            }
        }
    }
}

module.exports = {
    postWebhook: postWebhook,
    getWebhook: getWebhook
}

