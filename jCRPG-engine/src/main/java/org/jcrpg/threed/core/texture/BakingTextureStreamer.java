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
import java.nio.ByteBuffer;
import java.util.ArrayList;

import com.ardor3d.extension.texturing.TextureStreamer;
import com.ardor3d.math.MathUtils;

public class BakingTextureStreamer implements TextureStreamer {
    private final int _textureSliceSize;

    private TexturizerWithBlendArrayFunction3D _function;
    
    private BufferedImage[] _orderedTextures;

    public BakingTextureStreamer(final int textureSliceSize, TexturizerWithBlendArrayFunction3D function) {
        _textureSliceSize = textureSliceSize;

        _function = function;
        _orderedTextures = function.getImages();
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

                final double[] blends = _function.eval((sX + x) * scale, (sY + y) * scale, 0);
                
                int blendCount = 0;
                double totalBlendScale = 0;
                for (double blend:blends)
                {
                	totalBlendScale+=blend;
                }
                color[0] = 0;
                color[1] = 0;
                color[2] = 0;
                
                for (double blend:blends)
                {
                	if (blend>0)
                	{
                		BufferedImage img =
                			_orderedTextures[blendCount];
                        final int xx1 = MathUtils.moduloPositive(xx, img.getWidth());
                        final int yy1 = MathUtils.moduloPositive(yy, img.getHeight());
                        final int rgb = img.getRGB(xx1, yy1);
                        blend = blend/totalBlendScale;
                        color[0] += (byte) (((rgb >> 16) & 0xff) * blend);
                        color[1] += (byte) (((rgb >> 8) & 0xff) * blend);
                        color[2] += (byte) (((rgb) & 0xff) * blend);
                	}
                	blendCount++;
                }
                
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
