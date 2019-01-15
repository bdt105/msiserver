var $ = require('jquery'); // jQuery now loaded and assigned to $
$('#startserverbtn').on('click', function () {
    var msiserver = require('./dist/msiapiserver');
    var msiservr = new msiserver.MsiApiServer();
    var ret = msiservr.initApi();
    $('#log').text(ret);
});
//# sourceMappingURL=startserver.js.map