function waitAndPrint(callback, time) {
    return new Promise(resolve => {
        setTimeout(() => {
            callback && callback();
            resolve();
        }, time);
    })
}





module.exports = {
    waitAndPrint: waitAndPrint
}