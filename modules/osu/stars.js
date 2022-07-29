const get_icon = require('./starsDiff');

module.exports = (star, a_mode) => {
    switch (a_mode) {
        case 0:
            a_mode = 'std';
            break;
        case 1:
            a_mode = 'taiko';
            break;
        case 2:
            a_mode = 'ctb';
            break;
        case 3:
            a_mode = 'mania';
            break;
        default:
            a_mode = 'std';
            break;
    }
    let diff = 1
    if (star >= 7 && star < 8) diff = 9
    else if (star >= 8) diff = 10
    else if (star >= 1.75 && star < 7) {
        diff += Math.ceil((star - 1.74999) / 0.75)
    }
    return get_icon({type: `diff_${a_mode}_${diff}`})
}