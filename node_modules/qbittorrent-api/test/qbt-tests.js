var assert = require("assert");
var qBittorrent = require("..");

var session = qBittorrent.connect("localhost:9091");
session.version(function (error, data) {
  assert.ifError(error);
  assert.ok(data.startsWith("v"));
  session.active(function (error, data) {
    assert.ifError(error);
    var item = data[0];
    assert.ok(item.hash);
    session.details(item, function (error, data) {
      assert.ifError(error);
      assert.equal(item.hash, data[0].hash);
    });
    var label = item.label;
    session.setLabel(item.hash, "test", function (error) {
      assert.ifError(error);
      session.search(item.name, function (error, data) {
        assert.ifError(error);
        var flag = false;
        data.forEach(function (item2) {
          if (item2.name === item.name) {
            flag = true;
            assert.equal(item.hash, item2.hash);
            assert.equal(item2.label, "test");
            session.setLabel(item2, label);
          }
        });
        assert.ok(flag);
      });
    });
  });
});

