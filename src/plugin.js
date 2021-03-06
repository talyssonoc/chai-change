(function() {

function plugin(chai,util) {

  var Assertion = chai.Assertion;
  var flag = util.flag;

  chai.Assertion.addMethod('alter',assertChange);
  chai.assert.alters = assertInterfaceChange;
  chai.assert.unaltered = assertInterfaceNoChange;

  /**
   * ### .alters(getValue)
   *
   * Asserts that the value returned by `getValue`
   * alters after the function has run:
   *
   *     var x = 0;
   *     expect(function() { x += 1; }).to.alter(function() { return x });
   *
   *     expect(function() {}).not.to.alter(function() { return x });
   *
   * You can pass options to be specific about the alters expected. Use the `from` 
   * key to enforce a starting value, a `to` key for and ending value, and a
   * `by` key to enforce a numeric alters.
   *
   *     expect(function() { x += 1 }).to.alter(function() { return x },{by: 1});
   *     expect(function() { x += 1 }).to.alter(function() { return x },{from: x});
   *     expect(function() { x += 1 }).to.alter(function() { return x },{from: x, to: x + 1});
   *     expect(function() { x += 1 }).to.alter(function() { return x },{to: x + 1});
   *
   * @name alters
   * @param {Function} changer
   * @param {Function} getValue
   * @param {Object} options _optional_
   * @api public
   */
  function assertChange(changeWatcher, changeSpec, msg) {
    if(msg) flag(this, 'message', msg);
    var body = flag(this, 'object');
    var negated = flag(this,'negate');

    var chai = this;
    var FAIL = {};

    changeSpec = changeSpec || {}

    withFail(function() {
      if(changeSpec) new Assertion(changeSpec).is.a('object');

      new Assertion(body, msg).is.a('function');
      new Assertion(changeWatcher, msg).is.a('function');

      if(changeWatcher.length > 0 || body.length > 0) {
        chai.assert(changeSpec.callback != null,"For asynchronous tests, need to pass a `done(err)` function as `callback:` option");
      }

      runStep(changeWatcher,function(before) {
        withFail(preconditions,before);
        runStep(body,function() {
          runStep(changeWatcher,function(after) {
            var result = withFail(postconditions,before,after);
            if(result !== FAIL && changeSpec.callback) changeSpec.callback();
          });
        });
      });
    });

    function preconditions(before) {
      if('by' in changeSpec) {
        if(typeof changeSpec.by !== 'number' || 
            (changeSpec.from != null && typeof changeSpec.from !== 'number')) {
          throw new Error('alters "by" assertions only work with numbers specified in "by" and or "from" options');
        }
        changeSpec.to = before + changeSpec.by;
      }
      if('from' in changeSpec && changeSpec.from !== before) {
        throw new Error("alters 'from' value wasn't equal to " + util.inspect(before));
      }
    }

    function postconditions(before,after) {
      if('to' in changeSpec) {
        chai.assert(
            after === changeSpec.to
          , 'expected ' + util.inspect(before) + ' to change to ' + util.inspect(changeSpec.to) + ', instead changed to ' + util.inspect(after)
          , 'didn\'t expect ' + util.inspect(before) + ' to have changed to ' + util.inspect(changeSpec.to)
        );
      } else {
        chai.assert(
            after !== before
          , 'expected value to have changed from '  + util.inspect(before)
          , 'expected value to have remained unchanged from ' + util.inspect(before) + ', but changed to ' + util.inspect(after)
        );
      }
    }

    function runStep(fn,done) {
      if(fn.length === 0) return done(withFail(fn));
      fn(function(err,val) {
        if(err) return fail(err);
        done(val);
      });
    }

    function fail(err) {
      if(changeSpec.callback) return changeSpec.callback(err);
      if(!(err instanceof Error)) err = new Error(err);
      throw err;
    }

    function withFail(fn) {
      var args = [].slice.call(arguments,1);
      try {
        return fn.apply(null,args);
      } catch(e) {
        fail(e);
        return FAIL;
      }
    }

    return this;

  };
  /**
   * ### .alters(getValue)
   *
   * Asserts that the value returned by `getValue`
   * alters after the `affect` function has run:
   *
   *     var x = 0;
   *     assert.alters(function() { x += 1; },function() { return x });
   *
   * You can pass options to be specific about the alters expected. Use the `from` 
   * key to enforce a starting value, a `to` key for and ending value, and a
   * `by` key to enforce a numeric alters.
   *
   *     assert.alters(function() { x += 1 },function() { return x },{by: 1});
   *     assert.alters(function() { x += 1 },function() { return x },{from: x});
   *     assert.alters(function() { x += 1 },function() { return x },{from: x, to: x + 1});
   *     assert.alters(function() { x += 1 },function() { return x },{to: x + 1});
   *
   * @name alters
   * @param {Function} affect
   * @param {Function} getValue
   * @param {Object} options _optional_
   * @param {String} message
   * @api public
   */
  function assertInterfaceChange(fn, changeWatcher, opts, msg) {
    if(typeof opts === 'string') {
      msg = opts;
      opts = null;
    }
    new Assertion(fn, msg).to.alter(changeWatcher,opts);
  };

  /**
   * ### .alters(getValue)
   *
   * Asserts that the value returned by `getValue`
   * doesn't alters after the `affect` has run:
   *
   *     var x = 0;
   *     assert.unaltered(doesNothing, function() { return x });
   *     function doesNothing() {}
   *
   * @name alters
   * @param {Function} affect
   * @param {Function} getValue
   * @param {Object} options _optional_
   * @param {String} message
   * @api public
   */

  function assertInterfaceNoChange(fn, changeWatcher, opts, msg) {
    if(typeof opts === 'string') {
      msg = opts;
      opts = null;
    }
    new Assertion(fn, msg).not.to.alter(changeWatcher,opts);
  };

}

if(typeof module === "undefined") {
  if(typeof define === "function" && define.amd) {
    define([],function() {
      return plugin;
    });
  } else {
    chai.use(plugin);
  }
} else {
  module.exports = plugin;
}


})();
