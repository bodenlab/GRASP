align_graph = function(graph1, graph2) {

    var graph1 = {"nodes":[{"mutants":{"chars":[{"label":"R","value":6}]},"x":3,"y":0,"id":3,"label":"R","class":"","lane":0,"graph":{"bars":[{"x_label":"R","value":100}]},"seq":{"chars":[{"label":"R","value":6}]}},{"mutants":{"chars":[{"label":"A","value":2},{"label":"S","value":4},{"label":"D","value":1},{"label":"E","value":6},{"label":"N","value":8}]},"x":6,"y":0,"id":6,"label":"S","class":"","lane":0,"graph":{"bars":[{"x_label":"A","value":9.523809523809524},{"x_label":"S","value":19.047619047619047},{"x_label":"D","value":4.761904761904762},{"x_label":"E","value":28.57142857142857},{"x_label":"N","value":38.095238095238095}]},"seq":{"chars":[{"label":"A","value":2},{"label":"S","value":4},{"label":"D","value":1},{"label":"E","value":6},{"label":"N","value":8}]}},{"mutants":{"chars":[{"label":"F","value":20}]},"x":7,"y":0,"id":7,"label":"F","class":"","lane":0,"graph":{"bars":[{"x_label":"F","value":100}]},"seq":{"chars":[{"label":"F","value":20}]}},{"mutants":{"chars":[{"label":"F","value":13},{"label":"L","value":8}]},"x":8,"y":0,"id":8,"label":"L","class":"","lane":0,"graph":{"bars":[{"x_label":"L","value":38.095238095238095},{"x_label":"F","value":61.904761904761905}]},"seq":{"chars":[{"label":"F","value":13},{"label":"L","value":8}]}},{"mutants":{"chars":[{"label":"Q","value":2},{"label":"R","value":3},{"label":"S","value":1},{"label":"T","value":2},{"label":"E","value":1},{"label":"K","value":11}]},"x":9,"y":2,"id":9,"label":"T","class":"","lane":2,"graph":{"bars":[{"x_label":"Q","value":10},{"x_label":"R","value":15},{"x_label":"S","value":5},{"x_label":"T","value":10},{"x_label":"E","value":5},{"x_label":"K","value":55.00000000000001}]},"seq":{"chars":[{"label":"Q","value":2},{"label":"R","value":3},{"label":"S","value":1},{"label":"T","value":2},{"label":"E","value":1},{"label":"K","value":11}]}},{"mutants":{"chars":[{"label":"Q","value":1},{"label":"K","value":18},{"label":"N","value":2}]},"x":10,"y":1,"id":10,"label":"K","class":"","lane":1,"graph":{"bars":[{"x_label":"Q","value":4.761904761904762},{"x_label":"K","value":85.71428571428571},{"x_label":"N","value":9.523809523809524}]},"seq":{"chars":[{"label":"Q","value":1},{"label":"K","value":18},{"label":"N","value":2}]}},{"mutants":{"chars":[{"label":"S","value":9},{"label":"F","value":10}]},"x":11,"y":2,"id":11,"label":"S","class":"","lane":2,"graph":{"bars":[{"x_label":"F","value":52.63157894736842},{"x_label":"S","value":47.368421052631575}]},"seq":{"chars":[{"label":"S","value":9},{"label":"F","value":10}]}},{"mutants":{"chars":[{"label":"V","value":19},{"label":"I","value":3}]},"x":12,"y":0,"id":12,"label":"V","class":"","lane":0,"graph":{"bars":[{"x_label":"I","value":13.636363636363635},{"x_label":"V","value":86.36363636363636}]},"seq":{"chars":[{"label":"V","value":19},{"label":"I","value":3}]}},{"mutants":{"chars":[{"label":"Q","value":1},{"label":"D","value":4},{"label":"E","value":1},{"label":"H","value":1},{"label":"Y","value":3},{"label":"K","value":9},{"label":"N","value":3}]},"x":13,"y":0,"id":13,"label":"K","class":"","lane":0,"graph":{"bars":[{"x_label":"Q","value":4.545454545454546},{"x_label":"D","value":18.181818181818183},{"x_label":"E","value":4.545454545454546},{"x_label":"H","value":4.545454545454546},{"x_label":"Y","value":13.636363636363635},{"x_label":"K","value":40.909090909090914},{"x_label":"N","value":13.636363636363635}]},"seq":{"chars":[{"label":"Q","value":1},{"label":"D","value":4},{"label":"E","value":1},{"label":"H","value":1},{"label":"Y","value":3},{"label":"K","value":9},{"label":"N","value":3}]}},{"mutants":{"chars":[{"label":"T","value":1},{"label":"I","value":5},{"label":"M","value":16}]},"x":15,"y":0,"id":15,"label":"I","class":"","lane":0,"graph":{"bars":[{"x_label":"I","value":22.727272727272727},{"x_label":"T","value":4.545454545454546},{"x_label":"M","value":72.72727272727273}]},"seq":{"chars":[{"label":"T","value":1},{"label":"I","value":5},{"label":"M","value":16}]}},{"mutants":{"chars":[{"label":"Q","value":1},{"label":"T","value":1},{"label":"K","value":18}]},"x":16,"y":1,"id":16,"label":"K","class":"","lane":1,"graph":{"bars":[{"x_label":"Q","value":5},{"x_label":"K","value":90},{"x_label":"T","value":5}]},"seq":{"chars":[{"label":"Q","value":1},{"label":"T","value":1},{"label":"K","value":18}]}},{"mutants":{"chars":[{"label":"Q","value":1},{"label":"E","value":13},{"label":"K","value":6}]},"x":17,"y":1,"id":17,"label":"E","class":"","lane":1,"graph":{"bars":[{"x_label":"Q","value":5},{"x_label":"K","value":30},{"x_label":"E","value":65}]},"seq":{"chars":[{"label":"Q","value":1},{"label":"E","value":13},{"label":"K","value":6}]}},{"mutants":{"chars":[{"label":"S","value":8},{"label":"T","value":4},{"label":"G","value":2},{"label":"N","value":1}]},"x":18,"y":1,"id":18,"label":"G","class":"","lane":1,"graph":{"bars":[{"x_label":"S","value":53.333333333333336},{"x_label":"T","value":26.666666666666668},{"x_label":"N","value":6.666666666666667},{"x_label":"G","value":13.333333333333334}]},"seq":{"chars":[{"label":"S","value":8},{"label":"T","value":4},{"label":"G","value":2},{"label":"N","value":1}]}},{"mutants":{"chars":[{"label":"R","value":15}]},"x":19,"y":1,"id":19,"label":"R","class":"","lane":1,"graph":{"bars":[{"x_label":"R","value":100}]},"seq":{"chars":[{"label":"R","value":15}]}},{"mutants":{"chars":[{"label":"L","value":17}]},"x":20,"y":0,"id":20,"label":"L","class":"","lane":0,"graph":{"bars":[{"x_label":"L","value":100}]},"seq":{"chars":[{"label":"L","value":17}]}}],"max_depth":2,"edges":{"edges_19:20":{"y1":1,"x1":19,"y2":0,"weight":50,"from":19,"x2":20,"to":20},"edges_15:16":{"y1":0,"x1":15,"y2":1,"weight":90,"from":15,"x2":16,"to":16},"edges_16:17":{"y1":1,"x1":16,"y2":1,"weight":90,"from":16,"x2":17,"to":17},"edges_17:18":{"y1":1,"x1":17,"y2":1,"weight":68,"from":17,"x2":18,"to":18},"edges_18:19":{"y1":1,"x1":18,"y2":1,"weight":68,"from":18,"x2":19,"to":19},"edges_10:11":{"y1":1,"x1":10,"y2":2,"weight":81,"from":10,"x2":11,"to":11},"edges_11:12":{"y1":2,"x1":11,"y2":0,"weight":86,"from":11,"x2":12,"to":12},"edges_13:15":{"y1":0,"x1":13,"y2":0,"weight":100,"from":13,"x2":15,"to":15},"edges_10:12":{"y1":1,"x1":10,"y2":0,"weight":13,"from":10,"x2":12,"to":12},"edges_12:13":{"y1":0,"x1":12,"y2":0,"weight":100,"from":12,"x2":13,"to":13},"edges_15:20":{"y1":0,"x1":15,"y2":0,"weight":9,"from":15,"x2":20,"to":20},"edges_17:20":{"y1":1,"x1":17,"y2":0,"weight":18,"from":17,"x2":20,"to":20},"edges_3:6":{"y1":0,"x1":3,"y2":0,"weight":22,"from":3,"x2":6,"to":6},"edges_3:8":{"y1":0,"x1":3,"y2":0,"weight":4,"from":3,"x2":8,"to":8},"edges_6:7":{"y1":0,"x1":6,"y2":0,"weight":90,"from":6,"x2":7,"to":7},"edges_6:9":{"y1":0,"x1":6,"y2":2,"weight":4,"from":6,"x2":9,"to":9},"edges_7:8":{"y1":0,"x1":7,"y2":0,"weight":90,"from":7,"x2":8,"to":8},"edges_8:11":{"y1":0,"x1":8,"y2":2,"weight":4,"from":8,"x2":11,"to":11},"edges_8:9":{"y1":0,"x1":8,"y2":2,"weight":86,"from":8,"x2":9,"to":9},"edges_8:10":{"y1":0,"x1":8,"y2":1,"weight":4,"from":8,"x2":10,"to":10},"edges_9:10":{"y1":2,"x1":9,"y2":1,"weight":90,"from":9,"x2":10,"to":10}}};
    var graph2 = {"nodes":[{"mutants":{"chars":[{"label":"Q","value":2},{"label":"D","value":14}]},"x":2,"y":0,"id":2,"label":"D","class":"","lane":0,"graph":{"bars":[{"x_label":"D","value":87.5},{"x_label":"Q","value":12.5}]},"seq":{"chars":[{"label":"Q","value":2},{"label":"D","value":14}]}},{"mutants":{"chars":[{"label":"A","value":1},{"label":"S","value":13},{"label":"T","value":1},{"label":"V","value":2}]},"x":4,"y":0,"id":4,"label":"S","class":"","lane":0,"graph":{"bars":[{"x_label":"A","value":5.88235294117647},{"x_label":"S","value":76.47058823529412},{"x_label":"T","value":5.88235294117647},{"x_label":"V","value":11.76470588235294}]},"seq":{"chars":[{"label":"A","value":1},{"label":"S","value":13},{"label":"T","value":1},{"label":"V","value":2}]}},{"mutants":{"chars":[{"label":"T","value":2},{"label":"V","value":1},{"label":"I","value":9},{"label":"M","value":5}]},"x":5,"y":0,"id":5,"label":"I","class":"","lane":0,"graph":{"bars":[{"x_label":"I","value":52.94117647058824},{"x_label":"T","value":11.76470588235294},{"x_label":"M","value":29.411764705882355},{"x_label":"V","value":5.88235294117647}]},"seq":{"chars":[{"label":"T","value":2},{"label":"V","value":1},{"label":"I","value":9},{"label":"M","value":5}]}},{"mutants":{"chars":[{"label":"A","value":2},{"label":"S","value":4},{"label":"D","value":1},{"label":"E","value":6},{"label":"N","value":8}]},"x":6,"y":0,"id":6,"label":"E","class":"","lane":0,"graph":{"bars":[{"x_label":"A","value":9.523809523809524},{"x_label":"S","value":19.047619047619047},{"x_label":"D","value":4.761904761904762},{"x_label":"E","value":28.57142857142857},{"x_label":"N","value":38.095238095238095}]},"seq":{"chars":[{"label":"A","value":2},{"label":"S","value":4},{"label":"D","value":1},{"label":"E","value":6},{"label":"N","value":8}]}},{"mutants":{"chars":[{"label":"F","value":20}]},"x":7,"y":1,"id":7,"label":"F","class":"","lane":1,"graph":{"bars":[{"x_label":"F","value":100}]},"seq":{"chars":[{"label":"F","value":20}]}},{"mutants":{"chars":[{"label":"F","value":13},{"label":"L","value":8}]},"x":8,"y":1,"id":8,"label":"F","class":"","lane":1,"graph":{"bars":[{"x_label":"L","value":38.095238095238095},{"x_label":"F","value":61.904761904761905}]},"seq":{"chars":[{"label":"F","value":13},{"label":"L","value":8}]}},{"mutants":{"chars":[{"label":"Q","value":2},{"label":"R","value":3},{"label":"S","value":1},{"label":"T","value":2},{"label":"E","value":1},{"label":"K","value":11}]},"x":9,"y":2,"id":9,"label":"K","class":"","lane":2,"graph":{"bars":[{"x_label":"Q","value":10},{"x_label":"R","value":15},{"x_label":"S","value":5},{"x_label":"T","value":10},{"x_label":"E","value":5},{"x_label":"K","value":55.00000000000001}]},"seq":{"chars":[{"label":"Q","value":2},{"label":"R","value":3},{"label":"S","value":1},{"label":"T","value":2},{"label":"E","value":1},{"label":"K","value":11}]}},{"mutants":{"chars":[{"label":"Q","value":1},{"label":"K","value":18},{"label":"N","value":2}]},"x":10,"y":0,"id":10,"label":"K","class":"","lane":0,"graph":{"bars":[{"x_label":"Q","value":4.761904761904762},{"x_label":"K","value":85.71428571428571},{"x_label":"N","value":9.523809523809524}]},"seq":{"chars":[{"label":"Q","value":1},{"label":"K","value":18},{"label":"N","value":2}]}},{"mutants":{"chars":[{"label":"S","value":9},{"label":"F","value":10}]},"x":11,"y":2,"id":11,"label":"F","class":"","lane":2,"graph":{"bars":[{"x_label":"F","value":52.63157894736842},{"x_label":"S","value":47.368421052631575}]},"seq":{"chars":[{"label":"S","value":9},{"label":"F","value":10}]}},{"mutants":{"chars":[{"label":"V","value":19},{"label":"I","value":3}]},"x":12,"y":0,"id":12,"label":"V","class":"","lane":0,"graph":{"bars":[{"x_label":"I","value":13.636363636363635},{"x_label":"V","value":86.36363636363636}]},"seq":{"chars":[{"label":"V","value":19},{"label":"I","value":3}]}},{"mutants":{"chars":[{"label":"Q","value":1},{"label":"D","value":4},{"label":"E","value":1},{"label":"H","value":1},{"label":"Y","value":3},{"label":"K","value":9},{"label":"N","value":3}]},"x":13,"y":0,"id":13,"label":"D","class":"","lane":0,"graph":{"bars":[{"x_label":"Q","value":4.545454545454546},{"x_label":"D","value":18.181818181818183},{"x_label":"E","value":4.545454545454546},{"x_label":"H","value":4.545454545454546},{"x_label":"Y","value":13.636363636363635},{"x_label":"K","value":40.909090909090914},{"x_label":"N","value":13.636363636363635}]},"seq":{"chars":[{"label":"Q","value":1},{"label":"D","value":4},{"label":"E","value":1},{"label":"H","value":1},{"label":"Y","value":3},{"label":"K","value":9},{"label":"N","value":3}]}},{"mutants":{"chars":[{"label":"Q","value":1},{"label":"R","value":3}]},"x":14,"y":1,"id":14,"label":"R","class":"","lane":1,"graph":{"bars":[{"x_label":"Q","value":25},{"x_label":"R","value":75}]},"seq":{"chars":[{"label":"Q","value":1},{"label":"R","value":3}]}},{"mutants":{"chars":[{"label":"T","value":1},{"label":"I","value":5},{"label":"M","value":16}]},"x":15,"y":0,"id":15,"label":"M","class":"","lane":0,"graph":{"bars":[{"x_label":"I","value":22.727272727272727},{"x_label":"T","value":4.545454545454546},{"x_label":"M","value":72.72727272727273}]},"seq":{"chars":[{"label":"T","value":1},{"label":"I","value":5},{"label":"M","value":16}]}},{"mutants":{"chars":[{"label":"Q","value":1},{"label":"T","value":1},{"label":"K","value":18}]},"x":16,"y":1,"id":16,"label":"K","class":"","lane":1,"graph":{"bars":[{"x_label":"Q","value":5},{"x_label":"K","value":90},{"x_label":"T","value":5}]},"seq":{"chars":[{"label":"Q","value":1},{"label":"T","value":1},{"label":"K","value":18}]}},{"mutants":{"chars":[{"label":"Q","value":1},{"label":"E","value":13},{"label":"K","value":6}]},"x":17,"y":1,"id":17,"label":"E","class":"","lane":1,"graph":{"bars":[{"x_label":"Q","value":5},{"x_label":"K","value":30},{"x_label":"E","value":65}]},"seq":{"chars":[{"label":"Q","value":1},{"label":"E","value":13},{"label":"K","value":6}]}},{"mutants":{"chars":[{"label":"S","value":8},{"label":"T","value":4},{"label":"G","value":2},{"label":"N","value":1}]},"x":18,"y":1,"id":18,"label":"S","class":"","lane":1,"graph":{"bars":[{"x_label":"S","value":53.333333333333336},{"x_label":"T","value":26.666666666666668},{"x_label":"N","value":6.666666666666667},{"x_label":"G","value":13.333333333333334}]},"seq":{"chars":[{"label":"S","value":8},{"label":"T","value":4},{"label":"G","value":2},{"label":"N","value":1}]}},{"mutants":{"chars":[{"label":"R","value":15}]},"x":19,"y":1,"id":19,"label":"R","class":"","lane":1,"graph":{"bars":[{"x_label":"R","value":100}]},"seq":{"chars":[{"label":"R","value":15}]}},{"mutants":{"chars":[{"label":"L","value":17}]},"x":20,"y":0,"id":20,"label":"L","class":"","lane":0,"graph":{"bars":[{"x_label":"L","value":100}]},"seq":{"chars":[{"label":"L","value":17}]}},{"mutants":{"chars":[{"label":"A","value":2},{"label":"Q","value":1},{"label":"D","value":6},{"label":"H","value":1},{"label":"K","value":1}]},"x":21,"y":0,"id":21,"label":"D","class":"","lane":0,"graph":{"bars":[{"x_label":"H","value":9.090909090909092},{"x_label":"A","value":18.181818181818183},{"x_label":"Q","value":9.090909090909092},{"x_label":"K","value":9.090909090909092},{"x_label":"D","value":54.54545454545454}]},"seq":{"chars":[{"label":"A","value":2},{"label":"Q","value":1},{"label":"D","value":6},{"label":"H","value":1},{"label":"K","value":1}]}}],"max_depth":2,"edges":{"edges_19:20":{"y1":1,"x1":19,"y2":0,"weight":50,"from":19,"x2":20,"to":20},"edges_15:16":{"y1":0,"x1":15,"y2":1,"weight":90,"from":15,"x2":16,"to":16},"edges_17:18":{"y1":1,"x1":17,"y2":1,"weight":68,"from":17,"x2":18,"to":18},"edges_11:12":{"y1":2,"x1":11,"y2":0,"weight":86,"from":11,"x2":12,"to":12},"edges_13:15":{"y1":0,"x1":13,"y2":0,"weight":81,"from":13,"x2":15,"to":15},"edges_13:14":{"y1":0,"x1":13,"y2":1,"weight":18,"from":13,"x2":14,"to":14},"edges_8:11":{"y1":1,"x1":8,"y2":2,"weight":4,"from":8,"x2":11,"to":11},"edges_8:10":{"y1":1,"x1":8,"y2":0,"weight":4,"from":8,"x2":10,"to":10},"edges_14:15":{"y1":1,"x1":14,"y2":0,"weight":18,"from":14,"x2":15,"to":15},"edges_16:17":{"y1":1,"x1":16,"y2":1,"weight":90,"from":16,"x2":17,"to":17},"edges_18:19":{"y1":1,"x1":18,"y2":1,"weight":68,"from":18,"x2":19,"to":19},"edges_10:11":{"y1":0,"x1":10,"y2":2,"weight":81,"from":10,"x2":11,"to":11},"edges_10:12":{"y1":0,"x1":10,"y2":0,"weight":13,"from":10,"x2":12,"to":12},"edges_12:13":{"y1":0,"x1":12,"y2":0,"weight":100,"from":12,"x2":13,"to":13},"edges_2:4":{"y1":0,"x1":2,"y2":0,"weight":72,"from":2,"x2":4,"to":4},"edges_15:20":{"y1":0,"x1":15,"y2":0,"weight":9,"from":15,"x2":20,"to":20},"edges_17:20":{"y1":1,"x1":17,"y2":0,"weight":18,"from":17,"x2":20,"to":20},"edges_4:5":{"y1":0,"x1":4,"y2":0,"weight":77,"from":4,"x2":5,"to":5},"edges_20:21":{"y1":0,"x1":20,"y2":0,"weight":50,"from":20,"x2":21,"to":21},"edges_5:6":{"y1":0,"x1":5,"y2":0,"weight":77,"from":5,"x2":6,"to":6},"edges_6:7":{"y1":0,"x1":6,"y2":1,"weight":90,"from":6,"x2":7,"to":7},"edges_6:9":{"y1":0,"x1":6,"y2":2,"weight":4,"from":6,"x2":9,"to":9},"edges_7:8":{"y1":1,"x1":7,"y2":1,"weight":90,"from":7,"x2":8,"to":8},"edges_8:9":{"y1":1,"x1":8,"y2":2,"weight":86,"from":8,"x2":9,"to":9},"edges_9:10":{"y1":2,"x1":9,"y2":0,"weight":90,"from":9,"x2":10,"to":10}}};

    console.log(graph1);
    console.log(graph2);

}