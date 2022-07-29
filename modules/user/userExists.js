const osuApi = require("../api/osuApi");
// get an user value and return true if it exists using osuapi and export it as a module
module.exports = async (username) => {
    try {
        let user = await osuApi().get(`/get_player_info?name=${username}&scope=all`);
        return true;
    } catch (err) {
        if (err.response) {
            return false;
        }
    }
}