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

import com.ardor3d.extension.terrain.Heightmap;

public class BasicHeightmap implements Heightmap {
    protected int size;
    //protected float[] heightData;

    Heightmap parent;
    
    public BasicHeightmap() {
        size = 1;
        //heightData = new float[1];
    }

    public BasicHeightmap(final Heightmap parent, final int size) {
    	this.parent = parent;
        this.size = size;
        //heightData = new float[size * size];
    }

    public BasicHeightmap(final float[] heightData, final int size) {
     //   this.heightData = heightData;
        this.size = size;
    }

    // interface

    public float getHeight(final int x, final int y) {
    	return parent.getHeight(x * 2, y * 2);
//        return heightData[y * size + x];
    }

    public int getSize() {
        return size;
    }

    public boolean isReady() {
        return true;//heightData != null;
    }

    // class

    public void setHeightData(final float[] heightData, final int size) {
      //  this.heightData = heightData;
        this.size = size;
    }

    public void setHeight(int x, int y, final float height) {
        /*x = MathUtils.moduloPositive(x, size);
        y = MathUtils.moduloPositive(y, size);
        heightData[y * size + x] = height;*/
    }
}
