/**
 * Copyright (c) 2008-2010 Ardor Labs, Inc.
 *
 * This file is part of Ardor3D.
 *
 * Ardor3D is free software: you can redistribute it and/or modify it 
 * under the terms of its license which may be found in the accompanying
 * LICENSE file or at <http://www.ardor3d.com/LICENSE>.
 */

package org.jcrpg.threed.core.texture;

import java.awt.image.BufferedImage;
import java.io.File;
import java.io.IOException;
import java.nio.ByteBuffer;

import javax.imageio.ImageIO;

import com.ardor3d.extension.texturing.TextureStreamer;
import com.ardor3d.math.MathUtils;
import com.ardor3d.math.functions.FbmFunction3D;
import com.ardor3d.math.functions.Function3D;
import com.ardor3d.math.functions.Functions;
import com.ardor3d.util.resource.ResourceLocatorTool;
import com.ardor3d.util.resource.SimpleResourceLocator;

public class CopyOfBakingTextureStreamer implements TextureStreamer {
    private final int _textureSliceSize;

    private BufferedImage img1;
    private BufferedImage img2;

    private Function3D function;

    public CopyOfBakingTextureStreamer(final int textureSliceSize) {
        _textureSliceSize = textureSliceSize;

        function = new FbmFunction3D(Functions.simplexNoise(), 6, 0.006, 0.5, 3.14);
        function = Functions.scaleInput(function, 0.5, 0.5, 0.5);
        function = Functions.translateInput(function, 0.5, 0.5, 0.5);
        function = Functions.clamp(function, 0, 1);

        try {
        	SimpleResourceLocator loc4 = new SimpleResourceLocator( new File("../media/textures/high/").toURI());
	        ResourceLocatorTool.addResourceLocator(ResourceLocatorTool.TYPE_TEXTURE, loc4);
            img1 = ImageIO.read(ResourceLocatorTool.locateResource(ResourceLocatorTool.TYPE_TEXTURE,
                    "stone.jpg").openStream());
            img2 = ImageIO.read(ResourceLocatorTool
                    .locateResource(ResourceLocatorTool.TYPE_TEXTURE, "sand2.jpg").openStream());
        } catch (final Exception ex) {
            ex.printStackTrace();
        }

    }

    public void updateLevel(final int unit, final int sX, final int sY) {
        ; // nothing to do?
    }

    public void copyImage(final int unit, final ByteBuffer sliceData, final int dX, final int dY, final int sX,
            final int sY, final int w, final int h) {
        final double scale = Math.pow(2, unit);
        final byte[] color = new byte[3];
        for (int y = 0; y < h; y++) {
            for (int x = 0; x < w; x++) {
                final int destX = MathUtils.moduloPositive(dX + x, _textureSliceSize);
                final int destY = MathUtils.moduloPositive(dY + y, _textureSliceSize);
                final int indexDest = (destY * _textureSliceSize + destX) * 3;

                // eval our function at the given slice and location
                final int xx = (int) ((sX + x) * scale);
                final int yy = (int) ((sY + y) * scale);

                final int xx1 = MathUtils.moduloPositive(xx, img1.getWidth());
                final int yy1 = MathUtils.moduloPositive(yy, img1.getHeight());
                final int rgb1 = img1.getRGB(xx1, yy1);
                final int xx2 = MathUtils.moduloPositive(xx, img2.getWidth());
                final int yy2 = MathUtils.moduloPositive(yy, img2.getHeight());
                final int rgb2 = img2.getRGB(xx2, yy2);

                final double blend1 = function.eval((sX + x) * scale, (sY + y) * scale, 0);
                final double blend2 = 1.0 - blend1;

                // place color channels in byte array
                color[0] = (byte) (((rgb1 >> 16) & 0xff) * blend1);
                color[1] = (byte) (((rgb1 >> 8) & 0xff) * blend1);
                color[2] = (byte) (((rgb1) & 0xff) * blend1);

                color[0] += (byte) (((rgb2 >> 16) & 0xff) * blend2);
                color[1] += (byte) (((rgb2 >> 8) & 0xff) * blend2);
                color[2] += (byte) (((rgb2) & 0xff) * blend2);

                // Place array into byte buffer
                sliceData.position(indexDest);
                sliceData.put(color);
            }
        }
    }

    public boolean isReady(final int unit) {
        return true;
    }
}
