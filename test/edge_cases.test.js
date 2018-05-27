import tap      from 'tape';
import martinez from '../src/';
import load     from 'load-json-file';
import path     from 'path';

tap.test('Edge cases', (main) => {

  main.test('touching hourglasses', (t) => {
    const shapes   = load.sync(path.join(__dirname, 'fixtures', 'hourglasses.geojson'));
    const subject  = shapes.features[0];
    const clipping = shapes.features[1];

    t.test('intersection', (t) => {
      const result = martinez.intersection(
        subject.geometry.coordinates,
        clipping.geometry.coordinates
      );
      t.deepEqual(result, [[[[0,0.5],[0.25,0.75],[0,1],[0,0.5]]],[[[0.75,0.75],[1,0.5],[1,1],[0.75,0.75]]]]);

      t.end();
    });

    t.test('union', (t) => {
      const result = martinez.union(
        subject.geometry.coordinates,
        clipping.geometry.coordinates
      );
      t.deepEqual(result, [[[[0,0],[0.5,0.5],[0.25,0.75],[0.5,1],[0,1.5],[0,1],[0,0.5],[0,0]]],[[[0.5,0.5],[1,0],[1,0.5],[1,1],[1,1.5],[0.5,1],[0.75,0.75],[0.5,0.5]]]]);

      t.end();
    });

    t.test('difference', (t) => {
      const result = martinez.diff(
        subject.geometry.coordinates,
        clipping.geometry.coordinates
      );
      t.deepEqual(result, [[[[0,0],[0.5,0.5],[0.25,0.75],[0,0.5],[0,0]]],[[[0.5,0.5],[1,0],[1,0.5],[0.75,0.75],[0.5,0.5]]]]);

      t.end();
    });

    t.test('difference 2', (t) => {
      const result = martinez.diff(
        clipping.geometry.coordinates,
        subject.geometry.coordinates
      );
      t.deepEqual(result, [[[[0,1],[0.25,0.75],[0.5,1],[0,1.5],[0,1]]],[[[0.5,1],[0.75,0.75],[1,1],[1,1.5],[0.5,1]]]]);

      t.end();
    });

    t.end();
  });

  main.test('polygon + trapezoid', (t) => {
    const shapes   = load.sync(path.join(__dirname, 'fixtures', 'polygon_trapezoid_edge_overlap.geojson'));
    const subject  = shapes.features[0];
    const clipping = shapes.features[1];

    t.test('intersection', function(t) {
      const result = martinez.intersection(
        subject.geometry.coordinates,
        clipping.geometry.coordinates
      );
      t.deepEqual(result, [[[[3.5,3.5],[7,0],[14,0],[17.5,3.5],[3.5,3.5]]]]);

      t.end();
    });

    t.test('union', (t) => {
      const result = martinez.union(
        subject.geometry.coordinates,
        clipping.geometry.coordinates
      );
      t.deepEqual(result, [[[[0,0],[7,0],[14,0],[21,0],[21,3.5],[17.5,3.5],[21,7],[0,7],[3.5,3.5],[0,3.5],[0,0]]]]);

      t.end();
    });

    t.test('difference', (t) => {
      const result = martinez.diff(
        subject.geometry.coordinates,
        clipping.geometry.coordinates
      );
      t.deepEqual(result, [[[[0,0],[7,0],[3.5,3.5],[0,3.5],[0,0]]],[[[14,0],[21,0],[21,3.5],[17.5,3.5],[14,0]]]]);

      t.end();
    });

    t.end();
  });

  main.test('overlapping edge + one inside', (t) => {
    const shapes   = load.sync(path.join(__dirname, 'fixtures', 'overlap_loop.geojson'));
    const subject  = shapes.features[0];
    const clipping = shapes.features[1];

    t.test('intersection', (t) => {
      const result = martinez.intersection(
        subject.geometry.coordinates,
        clipping.geometry.coordinates
      );
      t.deepEqual(result, [[[[57.8,-49.1],[177.8,-49.1],[177.8,-37.1],[57.8,-37.1],[57.8,-49.1]]]]);

      t.end();
    });

    t.test('union', (t) => {
      const result = martinez.union(
        subject.geometry.coordinates,
        clipping.geometry.coordinates
      );
      t.deepEqual(result, [[[[57.8,-97.1],[196.4,-97.1],[196.4,-11.5],[57.8,-11.5],[57.8,-37.1],[57.8,-49.1],[57.8,-97.1]]]]);

      t.end();
    });

    t.test('difference', (t) => {
      const result = martinez.diff(
        subject.geometry.coordinates,
        clipping.geometry.coordinates
      );
      t.deepEqual(result, []);

      t.end();
    });

    t.end();
  });

  main.test('overlapping Y shift', (t) => {
    const shapes   = load.sync(path.join(__dirname, 'fixtures', 'overlap_y.geojson'));
    const subject  = shapes.features[0];
    const clipping = shapes.features[1];

    t.test('intersection', function(t) {
      const result = martinez.intersection(
        subject.geometry.coordinates,
        clipping.geometry.coordinates
      );
      t.deepEqual(result, [[[[-1883,-8.5],[-1783,-8.5],[-1783,-3],[-1883,-3],[-1883,-8.5]]]]);

      t.end();
    });

    t.test('union', (t) => {
      const result = martinez.union(
        subject.geometry.coordinates,
        clipping.geometry.coordinates
      );
      t.deepEqual(result, [[[[-1883,-25],[-1783,-25],[-1783,-8.5],[-1783,-3],[-1783,75],[-1883,75],[-1883,-3],[-1883,-8.5],[-1883,-25]]]]);

      t.end();
    });

    t.test('difference', (t) => {
      const result = martinez.diff(
        subject.geometry.coordinates,
        clipping.geometry.coordinates
      );
      t.deepEqual(result, []);

      t.end();
    });

    t.end();
  });

  main.test('touching boxes', (t) => {
    const shapes   = load.sync(path.join(__dirname, 'fixtures', 'touching_boxes.geojson'));
    const subject  = shapes.features[0];
    const clipping = shapes.features[1];

    t.test('intersection', (t) => {
      const result = martinez.intersection(
        subject.geometry.coordinates,
        clipping.geometry.coordinates
      );
      t.deepEqual(result, []);

      t.end();
    });

    t.test('union', (t) => {
      const result = martinez.union(
        subject.geometry.coordinates,
        clipping.geometry.coordinates
      );
      t.deepEqual(result, [[[[0,0],[3,0],[3,1],[4,1],[4,2],[3,2],[3,3],[0,3],[0,0]]]]);

      t.end();
    });

    t.test('difference', (t) => {
      const result = martinez.diff(
        subject.geometry.coordinates,
        clipping.geometry.coordinates
      );
      t.deepEqual(result, [[[[0,0],[3,0],[3,1],[3,2],[3,3],[0,3],[0,0]]]]);

      t.end();
    });

    t.end();
  });

  main.test('disjoint union nesting', (t) => { // issue #47
    const p1 = [[[12.91,6.09],[12.91,6.91],[12.09,6.91],[12.09,6.09],[12.91,6.09]]
    ];
    const p2 = [
      [[12.75,6.25],[12.75,6.75],[11.75,6.75],[11.75,8.25],[12.75,8.25],[12.75,8.75],[11.75,8.75],[11.75,9.75],[11.25,9.75],[11.25,8.75],[10.25,8.75],[10.25,8.25],[11.25,8.25],[11.25,6.75],[10.25,6.75],[10.25,6.25],[12.75,6.25]],
      [[4.75,2.25],[4.75,2.75],[4.25,2.75],[4.25,2.25],[4.75,2.25]]
    ];
    t.deepEqual(martinez.union(p1, p2), [[[[[[4.25,2.25],[4.75,2.25],[4.75,2.75],[4.25,2.75],[4.25,2.25]]]]],[[[10.25,6.25],[12.09,6.25],[12.09,6.09],[12.91,6.09],[12.91,6.91],[12.09,6.91],[12.09,6.75],[11.75,6.75],[11.75,8.25],[12.75,8.25],[12.75,8.75],[11.75,8.75],[11.75,9.75],[11.25,9.75],[11.25,8.75],[10.25,8.75],[10.25,8.25],[11.25,8.25],[11.25,6.75],[10.25,6.75],[10.25,6.25]]]]);
    t.end();
  });

  main.test('collapsed edges removed', (t) => {
    const p1 = [[
      [355,139],
      [420,202],
      [384,237],
      [353,205],
      [330,230],
      [330,230],
      [291,197]
    ]];
    const p2 =[[
      [355,139],
      [420,202],
      [384,237],
      [353,205],

      [330,230],
      [330,230],
      [291,197]
    ]];

    t.deepEqual(martinez.intersection(p1, p2), [[[[291,197],[330,230],[353,205],[384,237],[420,202],[355,139]]]]);
    t.end();
  });

  main.test('fatal 1', (t) => {
    const shapes   = load.sync(path.join(__dirname, 'fixtures', 'fatal1.geojson'));
    const subject  = shapes.features[0];
    const clipping = shapes.features[1];

    t.test('intersection', (t) => {
      const result = martinez.intersection(
        subject.geometry.coordinates,
        clipping.geometry.coordinates
      );
      //console.log('intersection', JSON.stringify(result));
      t.deepEqual(result, [[[[117.63171592083741,3.271053337273843],[117.63180470386554,3.2708954059271265],[117.6320843,3.2708497],[117.6321104,3.2709415],[117.63171592083741,3.271053337273843]]]]);

      t.end();
    });

    t.test('union', (t) => {
      const result = martinez.union(
        subject.geometry.coordinates,
        clipping.geometry.coordinates
      );
      //console.log('union', JSON.stringify(result));
      t.deepEqual(result, [[[[117.62484785200004,3.283270575000117],[117.63171592083741,3.271053337273843],[117.6315993,3.2710864],[117.631605,3.2711063],[117.6315403,3.2711246],[117.6314897,3.2709469],[117.63180470386554,3.2708954059271265],[117.63331139400017,3.268215236000103],[117.659922722,3.255275783000087],[117.62484785200004,3.283270575000117]]]]);

      t.end();
    });

    t.test('difference', (t) => {
      const result = martinez.diff(
        subject.geometry.coordinates,
        clipping.geometry.coordinates
      );
      //console.log('diff', JSON.stringify(result));
      t.deepEqual(result, [[[[117.62484785200004,3.283270575000117],[117.63171592083741,3.271053337273843],[117.6321104,3.2709415],[117.6320843,3.2708497],[117.63180470386554,3.2708954059271265],[117.63331139400017,3.268215236000103],[117.659922722,3.255275783000087],[117.62484785200004,3.283270575000117]]]]);

      t.end();
    });

    t.end();
  });


  main.test('fatal 2', (t) => {
    const shapes   = load.sync(path.join(__dirname, 'fixtures', 'fatal2.geojson'));
    const subject  = shapes.features[0];
    const clipping = shapes.features[1];

    t.test('intersection', (t) => {
      const result = martinez.intersection(
        subject.geometry.coordinates,
        clipping.geometry.coordinates
      );
      t.deepEqual(result, [[[[-79.887688,40.444658],[-79.88768799972165,40.44465799897759],[-79.88768795318525,40.44465798378203],[-79.887688,40.444658]]],[[[-79.88768796122203,40.444657857562895],[-79.88724301621599,40.443023510093695],[-79.887574,40.44424199906833],[-79.88768796122203,40.444657857562895]]],[[[-79.88761078560448,40.44463125072726],[-79.8875759999999,40.44461799906841],[-79.887472,40.44457999906844],[-79.887351,40.44453499906845],[-79.88724,40.44449899906847],[-79.887128,40.44446399906846],[-79.8871280003921,40.44446400013584],[-79.88761078560448,40.44463125072726]]],[[[-79.88711873229528,40.44256717591859],[-79.88685922414403,40.4416281542633],[-79.88690199999989,40.44178499906848],[-79.887067,40.4423799990685],[-79.88711873229528,40.44256717591859]]]]);

      t.end();
    });

    t.test('union', (t) => {
      const result = martinez.union(
        subject.geometry.coordinates,
        clipping.geometry.coordinates
      );
      t.deepEqual(result, [
        [
          [
            [-79.894363,40.44117499906849],[-79.894272,40.44123699906842],[-79.894179,40.44123699906842],
            [-79.89357,40.441237999068484],[-79.893368,40.441238999068446],[-79.893169,40.441239999068465],
            [-79.8925749999999,40.441243999068476],[-79.892543,40.44124499906835],[-79.892377,40.44125199906844],
            [-79.892264,40.44125599906838],[-79.892213,40.44125799906857],[-79.891928,40.441241999068474],
            [-79.891816,40.44123699906842],[-79.891702,40.441229999068575],[-79.891555,40.44122299906853],
            [-79.891502,40.441215999068476],[-79.891437,40.44120099906849],[-79.891368,40.44117599906851],
            [-79.891262,40.441137999068566],[-79.890921,40.44101499906854],[-79.89092,40.44101499906854],
            [-79.889892,40.44067299906851],[-79.88955,40.440559999068554],[-79.889376,40.44050199906853],
            [-79.888857,40.44032999906851],[-79.888684,40.440272999068426],[-79.888579,40.440237999068586],
            [-79.888264,40.44013299906854],[-79.888159,40.44009899906841],[-79.88793,40.440022999068574],
            [-79.8872429999999,40.43979699906849],[-79.887015,40.43972199906852],[-79.886931,40.43969399906849],
            [-79.886921,40.43969299906843],[-79.886882,40.43968999906852],[-79.886626,40.43968799906853],
            [-79.886528,40.43968799906853],[-79.886501,40.43968699906842],[-79.88642,40.43968699906842],
            [-79.886393,40.43968699906842],[-79.886406,40.43974199906857],[-79.886445,40.43990699906852],
            [-79.886458,40.43996299906853],[-79.886476,40.440069999068506],[-79.88648,40.44009399906854],
            [-79.88652999999987,40.44039399906853],[-79.886548,40.44050199906853],[-79.886608,40.44071799906848],
            [-79.88661599999989,40.440745999068476],[-79.886788,40.4413689990685],[-79.886848,40.441586999068434],
            [-79.88685922414403,40.4416281542633],[-79.886548,40.440502],[-79.886393,40.439687],[-79.885782,40.436843],
            [-79.882656,40.436087],[-79.881163,40.438717],[-79.880716,40.439506],[-79.879353,40.441889],
            [-79.880724,40.442343],[-79.887128,40.444464],[-79.8871280003921,40.44446400013584],
            [-79.887182,40.44461099906854],[-79.887176,40.44464599906839],[-79.887158,40.4447569990685],
            [-79.887134,40.444810999068544],[-79.88695099999988,40.445137999068415],[-79.886934,40.44516499906851],
            [-79.886837,40.44533099906844],[-79.886745,40.44548899906847],[-79.886472,40.44596399906852],
            [-79.886381,40.446122999068365],[-79.886335,40.44620099906844],[-79.886199,40.4464369990684],
            [-79.886155,40.44651599906838],[-79.88611,40.44659399906846],[-79.885974,40.446827999068454],
            [-79.88593,40.44690699906842],[-79.886143,40.446980999068494],[-79.88638,40.447058999068375],
            [-79.887733,40.44750899906847],[-79.888184,40.44765899906843],[-79.888318,40.44771499906848],
            [-79.888366,40.44773499906852],[-79.888406,40.44777299906845],
            [-79.888547,40.447843999068475],[-79.888729,40.448060999068524],[-79.889005,40.448329999068356],
            [-79.8892419999999,40.448540999068435],[-79.889816,40.44905099906851],[-79.890444,40.44945899906849],
            [-79.89107299999988,40.4497789990684],[-79.891154,40.449820999068436],[-79.891768,40.45009799906849],
            [-79.892038,40.45017699906838],[-79.892372,40.45025199906842],[-79.892423,40.45026599906851],
            [-79.892423,40.45017299906844],[-79.892423,40.45010299906852],[-79.892424,40.45006999906842],
            [-79.892429,40.44997199906848],[-79.892431,40.44993999906836],[-79.892436,40.449918999068366],
            [-79.892452,40.44985699906839],
            [-79.892458,40.44983699906852],[-79.892529,40.44956799906845],[-79.892742,40.44876399906836],
            [-79.892759,40.44870099906847],[-79.892788,40.44858799906836],[-79.892802,40.44851799906848],
            [-79.892996,40.4475889990685],[-79.893015,40.44750399906845],[-79.893021,40.447475999068395],
            [-79.893163,40.44684999906851],[-79.893225,40.44649399906848],[-79.893242,40.44640399906853],
            [-79.893338,40.44599099906845],[-79.893428,40.44549099906846],
            [-79.893578,40.444658999068416],[-79.893584,40.44458899906848],[-79.893751,40.443836999068466],
            [-79.893782,40.443722999068385],[-79.893841,40.44344499906848],[-79.893923,40.443065999068416],
            [-79.893999,40.44271799906857],[-79.894005,40.442688999068444],[-79.894085,40.44231599906855],
            [-79.894169,40.441928999068494],[-79.894172,40.44191599906846],[-79.894231,40.44163799906855],
            [-79.894242,40.44160999906841],[-79.894257,40.44156199906851],[-79.894279,40.44148399906843],
            [-79.894336,40.44128999906837],[-79.894344,40.4412529990685],[-79.894363,40.44117499906849]]],
            [[[-79.887688,40.444657999068475],
            [-79.88768796122203,40.444657857562895],[-79.88768799972165,40.44465799897759],[-79.887688,40.444657999068475]]],
            [[[-79.88768795318525,40.44465798378203],[-79.88761078560448,40.44463125072726],[-79.887639,40.44464199906838],[-79.88768795318525,40.44465798378203]]],[[[-79.88724301621599,40.443023510093695],[-79.887235,40.442993999068484],
            [-79.887122,40.44257899906844],[-79.88711873229528,40.44256717591859],[-79.887122,40.442579],[-79.88724301621599,40.443023510093695]]]]);

      t.end();
    });

    t.test('difference', (t) => {
      const result = martinez.diff(
        subject.geometry.coordinates,
        clipping.geometry.coordinates
      );
      t.deepEqual(result, [[[[-79.88768799972165,40.44465799897759],[-79.88768796122203,40.444657857562895],[-79.887574,40.44424199906833],[-79.88724301621599,40.443023510093695],[-79.887122,40.442579],[-79.88711873229528,40.44256717591859],[-79.887067,40.4423799990685],[-79.88690199999989,40.44178499906848],[-79.88685922414403,40.4416281542633],[-79.886548,40.440502],[-79.886393,40.439687],[-79.885782,40.436843],[-79.882656,40.436087],[-79.881163,40.438717],[-79.880716,40.439506],[-79.879353,40.441889],[-79.880724,40.442343],[-79.887128,40.444464],[-79.8871280003921,40.44446400013584],[-79.887128,40.44446399906846],[-79.88724,40.44449899906847],[-79.887351,40.44453499906845],[-79.887472,40.44457999906844],[-79.8875759999999,40.44461799906841],[-79.88761078560448,40.44463125072726],[-79.88768795318525,40.44465798378203],[-79.88768799972165,40.44465799897759]]]]);

      t.end();
    });

    t.end();
  });

  main.end();
});
