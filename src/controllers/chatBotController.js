'use strict';
require("dotenv").config();
import request from "request";




let postWebhook = (req, res) =>{
    // Parse the request body from the POST
    let body = req.body;

    // Check the webhook event is from a Page subscription
    if (body.object === 'page') {

        // Iterate over each entry - there may be multiple if batched
        body.entry.forEach(function(entry) {

            // Gets the body of the webhook event
            let webhook_event = entry.messaging[0];
            console.log("WebHook_event: " + JSON.stringify(webhook_event));

            // Get the sender PSID
            let sender_psid = webhook_event.sender.id;  
            // Check if the event is a message or postback and
            // pass the event to the appropriate handler function
            if (webhook_event.message) {
                handleMessage(sender_psid, webhook_event.message);
            } else if (webhook_event.postback) {
                handlePostback(sender_psid, webhook_event.postback);
            }

            console.log('Sender PSID: ' + sender_psid);
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
    response = { "text": "yes" }
  } else if (payload === 'no') {
    response = { "text": "No" }
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
    "message":  response
  }
  console.log("request body" + JSON.stringify(request_body, null, 4));

  // Send the HTTP request to the Messenger Platform
  request({
    "uri": "https://graph.facebook.com/v9.0/me/messages",
    "qs": { "access_token": process.env.DEVC_CHATBOT_PAGE_TOKEN },
    "method": "POST",
    "json": request_body
  }, (err, res, body) => {
    if (!err) {
      console.log('message sent!');
      console.log('Message Sent: ' + JSON.stringify(response, null, 4));
    } else {
      console.error("Unable to send message:" + err);
    }
  }); 
}


function firstTrait(nlp, name) {
  return nlp && nlp.entities && nlp.traits[name] && nlp.traits[name][0];
}

function handleMessage(sender_psid, received_message) {
  let response;
  
  if (typeof message.text === 'undefined' && typeof message === 'undefined') {
    response = {"text": `Hi am Deve! Please select the START button to start a conversation`};
  } 
  // Checks if the message contains text
  if (received_message.text) {    
    // Create the payload for a basic text message, which
    // will be added to the body of our request to the Send API
    let res = received_message.text.toLowerCase();
    const greeting = firstTrait(received_message.nlp, 'wit$greetings');
    const bye = firstTrait(received_message.nlp, 'wit$bye');
    const thanks = firstTrait(received_message.nlp, 'wit$thanks');
    if (greeting && greeting.confidence > 0.8) {
      response = {"text": "Hi there! Welcome to DevC Chat page how can I assist You?"};
    } else if (bye && bye.confidence > 0.8) {
      response = {"text": "Thanks for visiting!"};
    }else if (thanks && thanks.confidence > 0.8) {
      response = {"text": `You 're welcome!`}
    }else if (res === 'options') {
      response = {"text": `You entered ${received_message.text}`};
    }
    else {
      response = {"text": `The bot needs more training. Enter 'options' to see avaible updates`};
    }    

  } else if (received_message.attachments) {
    // Get the URL of the message attachment
    let attachment_url = received_message.attachments[0].payload.url;
    response = {
      "attachment": {
        "type": "template",
        "payload": {
          "template_type": "generic",
          "elements": [{
            "title": "Is this the right picture?",
            "subtitle": "Tap a button to answer.",
            "image_url": attachment_url,
            "buttons": [
              {
                "type": "postback",
                "title": "Yes!",
                "payload": "yes",
              },
              {
                "type": "postback",
                "title": "No!",
                "payload": "no",
              }
            ],
          }]
        }
      }
    }
  } 
  
  // Send the response message
  callSendAPI(sender_psid, response);    
}





module.exports = {
    postWebhook: postWebhook,
    getWebhook: getWebhook
}

