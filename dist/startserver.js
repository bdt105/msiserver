var $ = require('jquery'); // jQuery now loaded and assigned to $
var msiserver = require('./dist/msiapiserver');
var msiservr = new msiserver.MsiApiServer();
$('#startserverbtn').on('click', function () {
    msiservr.start();
});
$('#stopserverbtn').on('click', function () {
    msiservr.stop();
});
$('#getidentifierbtn').on('click', function () {
    msiservr.getNewIdentifier(function (data, error) {
        $('#identifier').html(data);
    });
});
setInterval(function () {
    $('#log').html(msiservr.getLogs());
    $('#serverStatus').html("<br><span style='" + (msiservr.isStarted() ? "color: green'>ON" : "color: red'>OFF") + "</span>");
    $('#currentState').html((msiservr.getNextExecutionDate() ? msiservr.getNextExecutionDate() + " - " : "") + msiservr.getCurrentState());
    $('#countFileCopied').html(msiservr.getCountFileCopied());
    $('#startDate').html(msiservr.getStartDate());
    $('#stopDate').html(msiservr.getStopDate());
    $('#info').html("Identifier: " + msiservr.getIdentifier());
}, 500);
initConfiguration();
function initConfiguration() {
    var conf = msiservr.getConfiguration();
    if (!conf) {
        msiservr.loadConfiguration();
        conf = msiservr.getConfiguration();
    }
}
//# sourceMappingURL=startserver.js.map