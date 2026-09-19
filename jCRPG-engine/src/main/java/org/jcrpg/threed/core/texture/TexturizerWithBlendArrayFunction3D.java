package org.jcrpg.threed.core.texture;

import java.awt.image.BufferedImage;
import java.util.ArrayList;

/**
 * Simple interface describing a function that receives a 3 value tuple and returns a value.
 */
public interface TexturizerWithBlendArrayFunction3D {

	
	/**
	 * 
	 * @return Ordered images, in the order of the eval double blend array.
	 */
	BufferedImage[] getImages();
	
    /**
     * @param x
     *            the 1st value in our tuple
     * @param y
     *            the 2nd value in our tuple
     * @param z
     *            the 3rd value in our tuple
     * @return some value, generally (but not necessarily) in [-1, 1]
     */
    double[] eval(double x, double y, double z);

}