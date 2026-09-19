/**
 * Copyright (c) 2008-2010 Ardor Labs, Inc.
 *
 * This file is part of Ardor3D.
 *
 * Ardor3D is free software: you can redistribute it and/or modify it 
 * under the terms of its license which may be found in the accompanying
 * LICENSE file or at <http://www.ardor3d.com/LICENSE>.
 */

package org.jcrpg.threed.core;

import java.util.ArrayList;
import java.util.List;
import java.util.logging.Logger;

import org.jcrpg.threed.J3DCore;
import org.jcrpg.world.place.World;

import com.ardor3d.extension.terrain.Heightmap;
import com.ardor3d.extension.terrain.HeightmapPyramid;
import com.ardor3d.math.MathUtils;

public class WorldHeightmapPyramid implements HeightmapPyramid {
    private static final Logger logger = Logger.getLogger(WorldHeightmapPyramid.class.getName());

    private final List<Heightmap> heightmaps = new ArrayList<Heightmap>();
    private boolean doWrap = true;

    public WorldHeightmapPyramid() {}
    
    World base;

    public WorldHeightmapPyramid(final World baseHeightmap, final int clipLevelCount) {
    	base = baseHeightmap;
        heightmaps.add(0, baseHeightmap);
        buildLevels(clipLevelCount);
    }

    // interface

    public float getHeight(final int level, int x, int y) {
    	//if (!J3DCore.ONLY_NEW_TERRAIN && level==0) return Float.NEGATIVE_INFINITY;
        final Heightmap heightmap = getHeightmap(level);
        final int size = heightmap.getSize();

        if (size==0) System.out.println(heightmap.getClass()+" "+level);
        
        if (doWrap) {
            x = MathUtils.moduloPositive(x, size);
            y = MathUtils.moduloPositive(y, size);
        } else if (x < 0 || x >= size || y < 0 || y >= size) {
            return Float.NEGATIVE_INFINITY;
        }

        return heightmap.getHeight(x, y);
    }

    public int getSize(final int level) {
        return getHeightmap(level).getSize();
    }

    public int getHeightmapCount() {
        return heightmaps.size();
    }

    public boolean isReady(final int level) {
        return getHeightmap(level).isReady();
    }

    // class

    public List<Heightmap> getHeightmaps() {
        return heightmaps;
    }

    private Heightmap getHeightmap(int level) {
        level = Math.min(heightmaps.size() - 1, level);
        return heightmaps.get(level);
    }

    public void buildLevels(final int levels) {
        if (heightmaps.isEmpty()) {
            return;
        }

        final int baseSize = heightmaps.get(0).getSize();
        logger.info("Original heightmap size: " + baseSize);

        for (int i = 1; i < levels; i++) {
            final Heightmap parentHeightmap = heightmaps.get(i - 1);
            final int currentSize = (int) (baseSize / Math.pow(2, i));

            org.jcrpg.threed.core.BasicHeightmap heightmap = null;
            if (i >= heightmaps.size()) {
                heightmap = new org.jcrpg.threed.core.BasicHeightmap(parentHeightmap,currentSize);
                heightmaps.add(heightmap);
            } else {
                heightmap = (org.jcrpg.threed.core.BasicHeightmap)heightmaps.get(i);
            }

            //logger.info("Building heightmap mipmap of size: " + currentSize);

            /*for (int x = 0; x < currentSize; x++) {
                for (int y = 0; y < currentSize; y++) {
                    heightmap.setHeight(x, y, parentHeightmap.getHeight(x * 2, y * 2));
                }
            }*/

        }
    }

    public boolean isDoWrap() {
        return doWrap;
    }

    public void setDoWrap(final boolean doWrap) {
        this.doWrap = doWrap;
    }
}
