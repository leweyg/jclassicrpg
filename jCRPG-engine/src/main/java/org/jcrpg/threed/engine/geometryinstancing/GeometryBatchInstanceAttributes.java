package org.jcrpg.threed.engine.geometryinstancing;

import org.jcrpg.threed.engine.geometryinstancing.instance.GeometryInstanceAttributes;

import com.ardor3d.math.ColorRGBA;
import com.ardor3d.math.Matrix3;
import com.ardor3d.math.Vector3;
import com.ardor3d.math.type.ReadOnlyTransform;
import com.ardor3d.scenegraph.Mesh;

/**
 * <code>GeometryBatchInstanceAttributes</code> specifies the attributes for a
 * <code>GeometryBatchInstance</code>
 *
 * @author Patrik Lindegran
 */
public class GeometryBatchInstanceAttributes extends GeometryInstanceAttributes {
    protected ColorRGBA color;
    private boolean colorChanged;
    
    
    public GeometryBatchInstanceAttributes(GeometryBatchMesh parent, Mesh mesh) {
    	this(parent, new Vector3(mesh.getTranslation()), 
    		 new Vector3(mesh.getScale()), 
    		 new Matrix3(mesh.getRotation()), mesh.getTransform(), true, 
    		 new ColorRGBA(mesh.getDefaultColor()));
    }
    
    public GeometryBatchInstanceAttributes(GeometryBatchMesh parent, GeometryBatchInstanceAttributes attributes) {
    	super(parent,attributes);
    	this.color = attributes.color;
    }

    public GeometryBatchInstanceAttributes(GeometryBatchMesh parent, Vector3 translation, Vector3 scale, Matrix3 rotation, ReadOnlyTransform transform, boolean visible, ColorRGBA color) {
        super(parent, translation, scale, rotation, transform, visible);
        this.color = color;
    }

    public ColorRGBA getColor() {
        return color;
    }

    public void setColor(ColorRGBA color) {
        this.color = color;
    }

	public boolean isColorChanged() {
		return colorChanged;
	}

	public void setColorChanged(boolean colorChanged) {
		parent.setNeedsPrecommit(true);
		this.colorChanged = colorChanged;
	}
}