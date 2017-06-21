package com.asr.grasp;

import json.JSONObject;

import javax.imageio.ImageIO;
import java.awt.*; //swing?
import java.awt.image.BufferedImage;
import java.io.File;
import java.io.IOException;

/**
 * Created by marnie on 17/5/17.
 */
public class DrawGraph {

    private final int NODE_HEIGHT = 40;
    private final int MARGIN = 25;

    private JSONObject graph;
    private int width, height;
    private GradientPaint gp;

    public DrawGraph(JSONObject graph){
        this.graph = graph;
        this.width = 1920;
        this.height = NODE_HEIGHT;
        this.gp = new GradientPaint(0,0,Color.BLUE,0,400,Color.CYAN);
    }

    public void drawImage(String filepath) throws IOException {
        BufferedImage bi = new BufferedImage(width, height, BufferedImage.TYPE_INT_ARGB);

        Graphics2D g2d = bi.createGraphics();
        g2d.setPaint(gp);

        // for smoother graphics
        RenderingHints qualityHints = new RenderingHints(RenderingHints.KEY_ANTIALIASING,RenderingHints.VALUE_ANTIALIAS_ON);
        qualityHints.put(RenderingHints.KEY_RENDERING,RenderingHints.VALUE_RENDER_QUALITY);
        g2d.setRenderingHints(qualityHints);

        g2d.fillOval(MARGIN, MARGIN, NODE_HEIGHT, NODE_HEIGHT);

        g2d.dispose();

        ImageIO.write(bi, "png", new File(filepath));
    }

    //public static void main()

}
