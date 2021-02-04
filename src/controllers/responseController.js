
function waitAndPrint(callback, time) {
    return new Promise(resolve => {
        setTimeout(() => {
            callback && callback();
            resolve();
        }, time);
    })
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


