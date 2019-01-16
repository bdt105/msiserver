var $ = require('jquery'); // jQuery now loaded and assigned to $
var msiserver = require('./dist/msiapiserver');
var msiservr = new msiserver.MsiApiServer();
$('#startserverbtn').on('click', function () {
    msiservr.initApi();
});
$('#stopserverbtn').on('click', function () {
    msiservr.stopApi();
});
setInterval(function () {
    $('#log').html(msiservr.getLogs());
    if (msiservr.getStatus()) {
        $('#serverStatus').html("<span style='color: green'>ON</span>");
    }
    else {
        $('#serverStatus').html("<span style='color: red'>OFF</span>");
    }
}, 1000);
//# sourceMappingURL=startserver.js.map