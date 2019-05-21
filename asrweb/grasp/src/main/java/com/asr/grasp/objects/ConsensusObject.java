package com.asr.grasp.objects;


import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.Stack;
import json.JSONArray;
import json.JSONObject;
import vis.Defines;

/**
 * A class that performs two functions:
 *      1. Parsing the JSON object
 *      2. Developing the consensus from this
 */
public class ConsensusObject {

    HashMap<Integer,  Node> nodeMap;
    ArrayList< Edge> edges;

    // These are the nodes that are dummy start and end nodes in the original version.
    // We keep them as they are used on the front end for signifying the start and end terminals.
    Node initialNode;
    Node finalNode;
    int numberNodes;

    // Map with heuristics
    HashMap<Integer, Double> cost = new HashMap<>();
    double[] weightArray;
    int[] countArray;

    int numberSeqsUnderNode;
    ArrayList<Integer> possibleInitialIds;
    ArrayList<Integer> possibleFinalIds;

    HashMap<Integer, Edge> initialAndFinalEdges;
    HashMap<Integer, Node> initialAndFinalNodeMap;

    // These are our best (or optimal) initial nodes. We use these to determine the consensus seq.
    Node bestInitialNode;
    Node bestFinalNode;

    public ConsensusObject(int[] edgeCounts, int numberSeqsUnderNode) {
        weightArray = new double[edgeCounts.length];
        for (int i = 0; i < edgeCounts.length; i ++) {
            weightArray[i] = (edgeCounts[i] * 1.0) /numberSeqsUnderNode;
        }
        this.numberSeqsUnderNode = numberSeqsUnderNode;
        this.countArray = edgeCounts;
        cost = new HashMap<>();
    }

    public double[] getWeightArray() {
        return this.weightArray;
    }

    private int getBestCount(ArrayList<Integer> possibleIds) {
        // Here we want to get the best count in the node dictionary.
        int bestCount = 0;
        for (Integer initialId: possibleIds) {
            int thisCount = countArray[initialId];
            if (thisCount > bestCount) {
                bestCount = thisCount;
            }
        }
        return bestCount;
    }


    /**
     To ensure that if we have a tie we actually choose the best one (lets for now say the
     best one is the one which has a higher sequence content in that column (very unlikely
     that this would be the same)
     Set the best first and last node ID's
     * @param ids
     * @param tagToLookFor
     * @return
     */
    public int getBestId(ArrayList<Integer> ids, Character tagToLookFor) {
        ArrayList<Integer> bestIds = new ArrayList<>();
        double errorMargin = 0.05 * numberSeqsUnderNode;
        int bestCount = getBestCount(ids);
        for (Integer i: ids) {
            // Check that the best IDS are with the error margin deemed to be 5% of the sequence count
            if (countArray[i] > bestCount - errorMargin) {
                bestIds.add(i);
            }
        }

        if (bestIds.size() == 0) {
            System.out.println("ERROR!");
            return ids.get(0);
        }
        if (bestIds.size() == 1) {
            return bestIds.get(0);
        }

        ArrayList<Integer> bestIdsWithMet = new ArrayList<>();
        if (tagToLookFor != null) {
            for (Integer i : bestIds) {
                if (nodeMap.get(i).getBase() == tagToLookFor) {
                    bestIdsWithMet.add(i);
                }
            }

            if (bestIdsWithMet.size() == 1) {
                return bestIdsWithMet.get(0);
            }
        }
        // If none had a met start tag we want to change it back to the original bestIds
        if (bestIdsWithMet.size() == 0) {
            bestIdsWithMet = bestIds;
        }

        double bestWeightVal = 0.0;
        int bestFinalId = 0;
        ArrayList<Integer> bestBiDir = new ArrayList<>();
        for (Integer i : bestIdsWithMet) {
            if (nodeMap.get(i).getBiDir()) {
                bestBiDir.add(i);
            }
        }
        if (bestBiDir.size() == 1) {
            return bestBiDir.get(0);
        }

        if (bestBiDir.size() == 0) {
            bestBiDir = bestIdsWithMet;
        }
        for (Integer i: bestBiDir) {
            double weightVal = countArray[i];
            if (weightVal > bestWeightVal) {
                bestWeightVal = weightVal;
                bestFinalId = i;
            }
        }
        return bestFinalId;
    }

    /**
     * This is used so we can create a consensus object and add the unformatted json after,
     * used to make it more efficient when we build the map at the start.
     * @param unformattedJson
     */
    public void setJsonObject(JSONObject unformattedJson) {
        formatJSON(unformattedJson);
    }

    /**
     * Format the JSON object into Java objects for processing.
     * @param unformattedJson
     */
    private void formatJSON(JSONObject unformattedJson) {
        JSONArray jsonNodes = unformattedJson.getJSONArray("nodes");
        JSONArray jsonEdges = unformattedJson.getJSONArray("edges");
        initialAndFinalEdges = new HashMap<>();
        edges = new ArrayList<>();
        nodeMap = new HashMap<>();
        initialAndFinalNodeMap = new HashMap<>();

        int initialId = 10000;
        int endId = 0;

        // Iterate through each node and add it to a map on ID
        for (int n = 0; n < jsonNodes.length(); n++) {
            JSONArray node = (JSONArray) jsonNodes.get(n);
            int nodeId = node.getInt(Defines.G_ID);
            Character base = (char) (int) node.get(Defines.G_CHAR);
            nodeMap.put(nodeId, new Node(base, nodeId, node, n));
            if (nodeId < initialId) {
                initialId = nodeId;
            }
            if (nodeId > endId) {
                endId = nodeId;
            }
        }

        possibleInitialIds = new ArrayList<>();
        possibleFinalIds = new ArrayList<>();

        // Iterate through each edge and add it to the edge array
        for (int e = 0; e < jsonEdges.length(); e++) {
            JSONArray edgeJson = (JSONArray) jsonEdges.get(e);
            int fromId = edgeJson.getInt(Defines.E_FROM);
            int toId = edgeJson.getInt(Defines.E_TO);


            boolean reciprocated = edgeJson.getInt(Defines.E_RECIPROCATED) == Defines.TRUE;
            double weight = edgeJson.getDouble(Defines.E_WEIGHT);
            Edge edge = new Edge(fromId, toId, weight, reciprocated, edgeJson, e);
            edges.add(edge);
            // Add the edge to the node map
            nodeMap.get(fromId).addOutEdge(edge);
            // If the from ID is the initial node id then we want to keep track of the possible
            // node IDs that were part of this.
            if (fromId == initialId) {
                possibleInitialIds.add(toId);
                initialAndFinalEdges.put(toId, edge);
                // Want to set that this node is bi-dir
                Node node = nodeMap.get(toId);
                node.setBiDir(edge.getReciprocated());
                initialAndFinalNodeMap.put(toId, node);

            }
            // Similarly, if the toId is the final node ID we want to keep track of this
            if (toId == endId) {
                possibleFinalIds.add(fromId);
                initialAndFinalEdges.put(fromId, edge);
                // set whether it is bidirectional or not
                Node node = nodeMap.get(fromId);
                node.setBiDir(edge.getReciprocated());
                initialAndFinalNodeMap.put(fromId, nodeMap.get(fromId));

            }
        }
        this.initialNode = nodeMap.get(initialId);
        this.finalNode = nodeMap.get(endId);
        // Calculate the best initial and final IDs
        initialId = getBestId(possibleInitialIds, 'M');
        endId = getBestId(possibleFinalIds, null);
        // Set these so we're able to get the edges that are from these
        this.bestInitialNode = nodeMap.get(initialId);
        this.bestFinalNode = nodeMap.get(endId);

        // Set the numberof nodes to be the end ID
        numberNodes = nodeMap.size();
    }



    /**
     * Converts the consensus object into the JSON representation required by the grasp app.
     * @return
     */
    public JSONObject getAsJson() {
        JSONArray nodesJSON = new JSONArray();
        JSONArray edgesJSON = new JSONArray();
        JSONObject jsonMap = new JSONObject();
        for (Edge e: edges) {
            edgesJSON.put(e.arrayPos, e.edgeAsJson);
        }
        for (Integer n: nodeMap.keySet()) {
            nodesJSON.put( nodeMap.get(n).arrayPos, nodeMap.get(n).nodeAsJson);
        }
        jsonMap.put("nodes", nodesJSON);
        jsonMap.put("edges", edgesJSON);
        return jsonMap;
    }


    /**
     * Method of adding in heuristics to the AStar search algorithm.
     * The aim is to get the path that has the most sequences in agreement.
     * However we also want the longest sequence (as this will contain the
     * fewest gaps).
     *
     * To do this we use the edge.getSequences().size() and multiply it by a
     * factor that penalises long gappy regions i.e. (1 + (1/gap_size))
     *
     * ToDo: optimise the heuristic function.
     *
     * @return
     */
    private double heuristicCostEstimate(Edge edge, Node from, Node to, boolean isBidirectional) {

        int multiplier = 1;
        int positionDiff = java.lang.Math.abs(to.getId() - from.getId());
        positionDiff = (positionDiff > 0) ? positionDiff : 1;

        if (to.getId() == finalNode.getId() || from.getId() == initialNode.getId()) {
            System.out.println("PASSED FINAL NODE OR TRYING FROM WRONG INITIAL NODE: " + from.getId() + "->" + to.getId());
            return Double.MAX_VALUE;
        }
        Double weight = weightArray[to.getId()] * weightArray[from.getId()];
        if (!isBidirectional) {
            multiplier = numberSeqsUnderNode;
        }

        if (weight == null) {
            // If we don't even have a weight just return the largest possible value for this path.
            System.out.println("RUNNING: " + from.getId() + "->" + to.getId() + "WEIGHT NULL: " + weight);
            return Double.MAX_VALUE;
        }

        double val = ((1 - weight) + 1); //
        if (val < 0) {
            // That is very strange and we need to return an error
            System.out.println("RUNNING: " + from.getId() + "->" + to.getId() + "VAL < 0: " + val);
            val = numberSeqsUnderNode;
        }
        if (val == 0 && multiplier != 1) {
            System.out.println("VAL == 0: " + val);
            return 1;
        }

        val =  multiplier * val * positionDiff;
        if (val <= 0) {
            System.out.println("RUNNING: " + from.getId() + "->" + to.getId() + "VAL <= 0 AFTER MULTIPLY: " + val);
            val = numberSeqsUnderNode;
        }

        return Math.abs(val);
    }


    /**
     * Reconstructs the consensus sequence based on the A* search. We need to
     * reverse the path and add in the gaps.
     *
     * @param cameFrom
     * @param current
     * @param gappy
     * @return
     */
    private String reconstructPath(HashMap< Node,  Path> cameFrom,  Node current, boolean gappy) {
        Stack<Character> sequence = new Stack<>();
        // Add the initial Base that we decided on during the pre-processing stage
        String sequenceString = "";
        // Set the initial and final edges
        initialAndFinalEdges.get(bestInitialNode.getId()).setConsensus(true);
        initialAndFinalEdges.get(bestFinalNode.getId()).setConsensus(true);

        while (cameFrom.keySet().contains(current)) {
            Path prevPath = cameFrom.get(current);
            prevPath.getEdge().setConsensus(true);
            Node prevNode = prevPath.getNode();
            // Set the edge to have a true consensus flag
            prevPath.getEdge().setConsensus(true);
            // If we have a character we want to add it
            if (current.getBase() != null) { //&& current != initialNode && current != finalNode) {
                sequence.push(current.getBase());
            }
            // Set to be the consensus path
            current.setConsensus(true);
            // If we have a gappy sequence we need to add in the gaps
            if (gappy) {
                int cameFromPosition = current.getId();
                int nextPosition = prevNode.getId();
                int numGaps = -1 * ((nextPosition - cameFromPosition) + 1);
                if (numGaps > 0) {
                    for (int g = 0; g < numGaps; g++) {
                        sequence.push('-');
                    }
                }
            }
            cameFrom.remove(current);
            current = prevNode;
        }

        for (int i = 0; i < bestInitialNode.getId(); i ++) {
            sequenceString += '-';
        }

        sequenceString += bestInitialNode.getBase();
        // Reverse and create a string
        while (!sequence.empty()) {
            sequenceString += sequence.pop();
        }
        // Finally we need to check if we are missing any of the end gaps
        if (bestFinalNode.getId() < finalNode.getId()) {
            int diff = finalNode.getId() - bestFinalNode.getId() - 1;
            while (diff > 0) {
                sequenceString += '-';
                diff --;
            }
        }
        return sequenceString;
    }


    public Node getLowestCostNode(ArrayList<Node> openSet) {
        double minCost = Double.MAX_VALUE;
        ArrayList<Node> bests = new ArrayList<>();
        for (Node n: openSet) {
            if (cost.get(n.getId()) < minCost) {
                minCost = cost.get(n.getId());
            }
        }
        if (minCost == Double.MAX_VALUE) {
            int i = 0;
        }
        // If there are multiple bests we want to tie break on the one with the smaller nodeId
        for (Node n: openSet) {
            if (cost.get(n.getId()) == minCost) {
                bests.add(n);
            }
        }

        // If the length of the array is > 1 we want to return the node with the  lowest ID
        Node best = null;
        int lowestId = 1000000000;
        for (Node n: bests) {
            if (n.getId() < lowestId) {
                lowestId = n.getId();
                best = n;
            }
        }
        // Remove the best node from the openset
        openSet.remove(best);

        return best;
    }


    /**
     * Gets the consensus sequences using an A star search algorithm.
     *
     * @param gappy
     * @return
     */
    public String getSupportedSequence(boolean gappy) {
        // Intanciate the comparator class
        Comparator< Node> comparator = new NodeComparator();
        // Already visited nodes
        ArrayList< Node> closedSet = new ArrayList<>();
        // Unvisted nodes keep track of the best options
        // ToDo Work out why priority queue isn't working
        //PriorityQueue< Node> openSet = new PriorityQueue<>(1000, comparator);
        ArrayList<Node> openSet = new ArrayList<>();
        // Add the initial node to the open set
        openSet.add(bestInitialNode);
        // Storing the previous node
        HashMap< Node,  Path> cameFrom = new HashMap<>();

        // Add the initial node cost
        cost.put(bestInitialNode.getId(), new Double(0));
        boolean printout = false;
        while (!openSet.isEmpty()) {
            Node current = getLowestCostNode(openSet); //openSet.poll();
            if (current == null) {
                current = openSet.get(0);
                openSet.remove(current);
            }
            if (current.equals(bestFinalNode)) {
                // Reconstruct the path
                return reconstructPath(cameFrom, current, gappy);
            }
            // Otherwise add this to the closedSet
            closedSet.add(current);

            if (printout) {
                System.out.println("Looking at edges from: " + current.getId());
            }
            for (int n = 0; n < current.getOutEdges().size(); n++) {
                Edge next = current.getOutEdges().get(n);
                Node neighbor = nodeMap.get(next.getToId());
                double thisCost = heuristicCostEstimate(next, current, neighbor, current.getOutEdges().get(n).reciprocated);
                if (closedSet.contains(neighbor)) {
                    // Check if this path is better and update the path to get to the neighbour
                    if (cost.get(neighbor.getId()) > thisCost) {
                        //cameFrom.put(neighbor, new Path(current, next));
                        cost.put(neighbor.getId(), thisCost);
                    }
                    continue; // ignore as it has already been visited
                }
                // Otherwise we set the cost to this node
                double tentativeCost = cost.get(current.getId()) + thisCost;

                // Check if we have discovered a new node
                if (!openSet.contains(neighbor)) {
                    // Assign the cost to the node
                    neighbor.setCost(tentativeCost);
                    cost.put(neighbor.getId(), tentativeCost);
                    openSet.add(neighbor);
                } else if (tentativeCost > cost.get(neighbor.getId())) {
                    if (printout) {
                        System.out.println("WORSE : " + current.getBase() + "-" + neighbor.getBase() + ": " + neighbor.getId() + " , " + neighbor.getBase() + ":" + thisCost + ", " + tentativeCost + " vs." + neighbor.getCost());
                    }
                    continue; // This isn't a better path
                }
                cost.put(neighbor.getId(), tentativeCost);
                neighbor.setCost(tentativeCost);

                if (printout) {
                    System.out.println("BETTER : " + current.getBase() + "-" + neighbor.getBase() + ": " + neighbor.getId() + " , " + neighbor.getBase() + ":" + thisCost + ", " + tentativeCost + " vs." + cost.get(neighbor.getId()));
                }
                // Check if we already have this in the camefrom path, if so remove
                // ToDo: Check if overriding is causing issues?
                if (cameFrom.get(neighbor) != null) {
                    //System.out.println("ALREADY HAD PATH, BEING OVERRIDDEN, " + cameFrom.get(neighbor).edge.fromId + "->" + cameFrom.get(neighbor).edge.toId + ", " + cameFrom.get(neighbor).node.base + " to " + current.base + " path:" + next.fromId + " ->" + next.toId);
                }
                // If we have made it here this is the best path so let's
                cameFrom.put(neighbor, new Path(current, next));
            }
        }
        return null;
    }


    /**
     * Comparator class for ensuring the nodes with the largest cost are
     * kept at the front of the queue.
     *
     * Here, we want to maximise the cost as we are trying to get either:
     * 		a. the longest sequence, or
     * 		b. the path which the greatest number of sequences agree on.
     */
    public class NodeComparator implements Comparator< Node>
    {
        @Override
        public int compare( Node x,  Node y)
        {
            if (cost.get(x.getId()) < cost.get(y.getId()))
            {
                return -1;
            }
            if (cost.get(x.getId()) > cost.get(y.getId()))
            {
                return 1;
            }
            if (x.getId() < y.getId()) {
                return -1;
            }
            if (x.getId() > y.getId()) {
                return 1;
            }
            return 0;
        }
    }

    /**
     * Helper class to store the path. Keeps track of the edge and the node
     * that lead to a particular path. We need to keep track of the edge to
     * be able to set it as 'consensus' and the node to be able to get the
     * character.
     */
    public class Path {
        private  Node node;
        private  Edge edge;

        public Path( Node node,  Edge edge) {
            this.edge = edge;
            this.node = node;
        }

        public  Node getNode() { return this.node; }

        public  Edge getEdge() { return this.edge; }
    }

    public class Edge {
        private int fromId;
        private int toId;
        private double weight;
        private boolean reciprocated;
        private boolean consensus;
        private JSONArray edgeAsJson;
        private String id;
        private int arrayPos;

        public Edge(int fromId, int toId, double weight, boolean reciprocated, JSONArray edgeAsJson, int arrayPos) {
            this.arrayPos = arrayPos;
            this.fromId = fromId;
            this.toId = toId;
            this.weight = weight;
            this.reciprocated = reciprocated;
            this.edgeAsJson = edgeAsJson;
            this.edgeAsJson.put(Defines.E_CONSENSUS, Defines.FALSE);
            this.id = fromId + "-" + toId;
        }

        public void setConsensus(boolean consensus) {
            this.consensus = consensus;
            edgeAsJson.put(Defines.E_CONSENSUS, Defines.TRUE);
        }

        public boolean getReciprocated () { return this.reciprocated; }

        public int getFromId() { return this.fromId; }

        public int getToId() { return this.toId; }

        public double getWeight() { return this.weight; }

        public void setWeight(double weight) { this.weight = weight; }

    }

    public class Node {
        private char base;
        private int id;
        private ArrayList< Edge> outEdges;
        private double cost = Double.MAX_VALUE;
        private boolean consensus = false;
        private JSONArray nodeAsJson;
        int arrayPos = 0;
        private boolean isBiDir = false;

        public Node(char base, int id, JSONArray nodeAsJson, int arrayPos) {
            this.base = base;
            this.arrayPos = arrayPos;
            this.id = id;
            this.outEdges = new ArrayList<>();
            this.nodeAsJson = nodeAsJson;
            this.nodeAsJson.put(Defines.G_CONSENSUS, Defines.FALSE);
        }

        public void setBiDir(boolean isBiDir) {
            this.isBiDir = isBiDir;
        }

        public boolean getBiDir() {
            return this.isBiDir;
        }

        public ArrayList< Edge> getOutEdges() {
            return this.outEdges;
        }

        public double getCost() { return this.cost; }

        public void setCost(double cost) {
            this.cost = cost;
        }

        public void addOutEdge( Edge edge) {
            this.outEdges.add(edge);
        }

        public void setConsensus(boolean consensus) {
            this.nodeAsJson.put(Defines.G_CONSENSUS, Defines.TRUE);
            this.consensus = consensus;
        }

        public boolean getConsensus() {
            return consensus;
        }

        public Character getBase() { return this.base; }


        public int getId()  { return this.id; }
    }
}