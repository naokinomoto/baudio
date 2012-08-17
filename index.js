var Stream = require('stream');

module.exports = function (opts, fn) {
    var stream = new Stream;
    stream.readable = true;
    
    if (typeof opts === 'function') {
        fn = opts;
        opts = {};
    }
    if (!opts) opts = {};
    var size = opts.size || 2048;
    var rate = opts.rate || 44000;
    
    var t = 0, step = 0;
    
    stream.end = function () {
        stream.ended = true;
    };
    
    stream.destroy = function () {
        stream.destroyed = true;
        stream.emit('end');
    };
    
    stream.pause = function () {
        stream.paused = true;
    };
    
    stream.resume = function () {
        if (!stream.paused) return;
        stream.paused = false;
        stream.emit('resume');
    };
    
    process.nextTick(function loop () {
        var buf = new Buffer(size);
        for (var i = 0; i <= size - 2; i += 2) {
            var n = fn.call(stream, t, step);
            step ++;
            t += 1 / rate;
            buf.writeInt16LE(signed(n), i);
        }
        
        if (stream.destroyed) {
            // no more events
        }
        else if (stream.paused) {
            stream.once('resume', function () {
                stream.emit('data', buf);
                process.nextTick(loop);
            });
        }
        else {
            stream.emit('data', buf);
            if (stream.ended) stream.emit('end');
            else process.nextTick(loop);
        }
    });
    
    return stream;
};

function signed (n) {
    if (isNaN(n)) return 0;
    var b = Math.pow(2, 15);
    return Math.max(-b, Math.min(b, Math.floor((b * n) - 1)));
}
