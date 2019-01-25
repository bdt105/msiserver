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
    $('#serverStatus').html("<span>" + msiservr.getStatus() + "</span>");
    $('#info').html("Identifier: " + msiservr.getIdentifier() + (msiservr.getNextExecutionDate() ? ", next execution: " + msiservr.getNextExecutionDate() : ""));
}, 1000);
initConfiguration();
function initConfiguration() {
    var conf = msiservr.getConfiguration();
    if (!conf) {
        msiservr.loadConfiguration();
        conf = msiservr.getConfiguration();
    }
}
//# sourceMappingURL=startserver.js.map