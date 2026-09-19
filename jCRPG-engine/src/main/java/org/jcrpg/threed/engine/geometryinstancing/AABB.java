package org.jcrpg.threed.engine.geometryinstancing;

import java.nio.FloatBuffer;

import com.ardor3d.bounding.BoundingBox;
import com.ardor3d.math.Vector3;
import com.ardor3d.util.geom.BufferUtils;

/**
 * <code>AABB/code> is an axis aligned bounding box, that is easy to <code>expand</code> using vertices. 
 * @author Patrik Lindegran
 */
public class AABB {
	private static final long serialVersionUID = 1L;
	
	public Vector3 min;
	public Vector3 max;
	
	public AABB() {
		min = new Vector3();
		max = new Vector3();
		reset();
	}
	
	public AABB(Vector3 min, Vector3 max) {
		this.min = new Vector3(min);
		this.max = new Vector3(max);
	}
	
	public void set(Vector3 min, Vector3 max) {
		this.min.set(min);
		this.max.set(max);
	}
	
	public void set(BoundingBox bb) {
		if (bb == null)
            return;
		min.setX( bb.getCenter().getX() - bb.getXExtent());
		min.setY( bb.getCenter().getY() - bb.getYExtent());
		min.setZ( bb.getCenter().getZ() - bb.getZExtent());
		
		max.setX( bb.getCenter().getX() + bb.getXExtent());
		max.setY( bb.getCenter().getY() + bb.getYExtent());
		max.setZ( bb.getCenter().getZ() + bb.getZExtent());
	}
	
	public void reset() {
		min.set(Float.POSITIVE_INFINITY,
				Float.POSITIVE_INFINITY,
				Float.POSITIVE_INFINITY);
		max.set(Float.NEGATIVE_INFINITY,
				Float.NEGATIVE_INFINITY,
				Float.NEGATIVE_INFINITY);
	}
	
	public void expand(Vector3 pos) {
		if (pos == null)
            return;
		min(min, pos);
		max(max, pos);
	}

	private void max(Vector3 max, Vector3 point) {
		if (min == null || max == null)
            return;
		max.setX( Math.max(max.getX(), point.getX()));
		max.setY( Math.max(max.getY(), point.getY()));
		max.setZ( Math.max(max.getZ(), point.getZ()));
	}

	private void min(Vector3 min, Vector3 point) {
		if (min == null || max == null)
            return;
		min.setX( Math.min(min.getX(), point.getX()));
		min.setY( Math.min(min.getY(), point.getY()));
		min.setZ( Math.min(min.getZ(), point.getZ()));
	}
	
	public void mergeLocal(AABB aabb) {
		if (aabb == null)
            return;
		
		expand(aabb.min);
		expand(aabb.max);
	}
	
	private Vector3 compVector = new Vector3();
	
	public void expand(FloatBuffer points) {
        if (points == null)
            return;

        points.rewind();
        if (points.remaining() <= 2) // we need at least a 3 float vector
            return;

        for (int i = 1, len = points.remaining() / 3; i < len; i++) {
            BufferUtils.populateFromBuffer(compVector, points, i);
            expand(compVector);
        }
    }
	
	public void getBoundingBox(BoundingBox boundingBox) {
		if (boundingBox == null)
            return;
		boundingBox.setXExtent((max.getX() - min.getX()) / 2d);
		boundingBox.setYExtent((max.getY() - min.getY()) / 2d);
		boundingBox.setZExtent((max.getZ() - min.getZ()) / 2d);
		
		boundingBox.setCenter(min.getX() + boundingBox.getXExtent(),
								    min.getY() + boundingBox.getYExtent(),
								    min.getZ() + boundingBox.getZExtent());
	}
	
	public void getCenter(Vector3 center) {
		if (center == null)
            return;
		center.set(min.getX() + (max.getX() - min.getX()) / 2f, 
				   min.getY() + (max.getY() - min.getY()) / 2f, 
				   min.getZ() + (max.getZ() - min.getZ()) / 2f);
	}
	
	public void getExtent(Vector3 extent) {
		if (extent == null)
            return;
		extent.set((max.getX() - min.getX()) / 2f, 
				   (max.getY() - min.getY()) / 2f, 
				   (max.getZ() - min.getZ()) / 2f);
	}
}
