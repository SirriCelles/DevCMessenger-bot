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
    callSendAPIWithOptions(sender_psid);
  } else if (payload === 'no') {
    response = { "text": `You selected "No"` }
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

  if( received_message && received_message.attachments && received_message.attachments[0].payload){
    callSendAPI(sender_psid, "Thank you for watching my video!!!");
    callSendAPIWithTemplate(sender_psid);
    return;
  }

  if (typeof received_message.text === 'undefined' && typeof received_message === 'undefined') {
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
      setTimeout(callSendAPIWithButtons(sender_psid), 200);
    } else if (bye && bye.confidence > 0.8) {
      // response = {"text": "Thanks for visiting!"};
      callSendAPIWithBye(sender_psid);
    }else if (thanks && thanks.confidence > 0.8) {
      response = {"text": `You 're welcome!`}
      callSendAPIWithBye(sender_psid);
    }else if (res === 'options') {
      response = botOptions;
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

let callSendAPIWithBye = (sender_psid) => {
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
};

request({
    "uri": "https://graph.facebook.com/v6.0/me/messages",
    "qs": { "access_token": process.env.DEVC_CHATBOT_PAGE_TOKEN},
    "method": "POST",
    "json": body
}, (err, res, body) => {
    if (!err) {
        console.log('message sent!')
    } else {
        console.error("Unable to send message:" + err);
    }
});
}


let callSendAPIWithButtons = (sender_psid) => {
    let body = {
      "recipient": {
          "id": sender_psid
      },
      "message": {
        "attachment":{
          "type":"template",
          "payload":{
            "template_type":"button",
            "text":"Want to get Updates??",
            "buttons":[
              {
                "type": "postback",
                "title": "Yes! View More",
                "payload": "yes",
              },
              {
                "type": "postback",
                "title": "No!",
                "payload": "no",
              }
            ]
          }
        }        
      }
  };

  request({
      "uri": "https://graph.facebook.com/v6.0/me/messages",
      "qs": { "access_token": process.env.DEVC_CHATBOT_PAGE_TOKEN},
      "method": "POST",
      "json": body
  }, (err, res, body) => {
      if (!err) {
          console.log('message sent!')
      } else {
          console.error("Unable to send message:" + err);
      }
  });
}

let callSendAPIWithOptions = (sender_psid) => {
  // document fb message template
  // https://developers.facebook.com/docs/messenger-platform/send-messages/templates
  let body = {
      "recipient": {
          "id": sender_psid
      },
      "message": {
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
  };

  request({
      "uri": "https://graph.facebook.com/v6.0/me/messages",
      "qs": { "access_token": process.env.DEVC_CHATBOT_PAGE_TOKEN},
      "method": "POST",
      "json": body
  }, (err, res, body) => {
      if (!err) {
          console.log('message sent!')
      } else {
          console.error("Unable to send message:" + err);
      }
  });
};

let botOptions = {
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
};








module.exports = {
    postWebhook: postWebhook,
    getWebhook: getWebhook
}

