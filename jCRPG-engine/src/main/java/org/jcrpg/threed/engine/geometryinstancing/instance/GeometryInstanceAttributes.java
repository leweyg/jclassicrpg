package org.jcrpg.threed.engine.geometryinstancing.instance;

import org.jcrpg.threed.engine.geometryinstancing.GeometryBatchMesh;

import com.ardor3d.math.Matrix3;
import com.ardor3d.math.Matrix4;
import com.ardor3d.math.Transform;
import com.ardor3d.math.Vector3;
import com.ardor3d.math.type.ReadOnlyTransform;

/**
 * <code>GeometryInstanceAttributes</code> specifies the attributes for a
 * <code>GeometryInstance</code>.
 *
 * @author Patrik Lindegran
 */
public class GeometryInstanceAttributes {
    protected Vector3 scale;       // Scale
    protected Matrix3 rotation;  // Rotation
    protected Vector3 translation; // Translation
    protected Matrix4 mtNormal;	// Normal matrix (scale, rotation)
    protected Matrix4 mtWorld;		// Local to world matrix (scale, rotation, translation)
    protected ReadOnlyTransform mtTransform;		// Local to world matrix (scale, rotation, translation)
    protected ReadOnlyTransform mtNormalTransform;		// Local to Normal matrix (scale, rotation)
    private boolean transformed;	// Has the attributes changed
    private boolean visible;		// Is the object visible
    protected GeometryBatchMesh parent;

    public GeometryInstanceAttributes(GeometryBatchMesh parent, GeometryInstanceAttributes attributes) {
    	this(parent, attributes.translation, attributes.scale, attributes.rotation, attributes.mtTransform, attributes.visible);
    }
    
    public GeometryInstanceAttributes(GeometryBatchMesh parent, Vector3 translation, Vector3 scale, Matrix3 rotation, ReadOnlyTransform transform, boolean visible) {
        this.scale = scale;
        this.rotation = rotation;
        this.translation = translation;
        this.visible = visible;
        this.mtTransform = transform;
        mtWorld = new Matrix4();
        mtNormal = new Matrix4();
        this.parent = parent;
        buildMatrices();
    }

    /** <code>buildMatrices</code> updates the world and rotation matrix */
    public void buildMatrices() {
        {
        	Transform t = new Transform();
            t.setIdentity();
            t.setRotation(rotation);
            t.setScale(scale);
            t.setTranslation(translation);
            mtTransform = t;
        }
        {
        	Transform t = new Transform();
            t.setIdentity();
            t.setRotation(rotation);
            t.setScale(scale);
            mtNormalTransform = t;
        }
        setTransformed(true);
        
	}

    public Vector3 getScale() {
        return scale;
    }

    /**
     * After using the <code>setScale</code> function, user needs to call the
     * <code>buildMatrices</code> function
     *
     * @param scale
     */
    public void setScale(Vector3 scale) {
        this.scale = scale;
    }

    public Vector3 getTranslation() {
        return translation;
    }

    /**
     * After using the <code>setTranslation</code> function, user needs to call
     * the <code>buildMatrices</code> function
     *
     * @param translation
     */
    public void setTranslation(Vector3 translation) {
        this.translation = translation;
    }

    public Matrix3 getRotation() {
        return rotation;
    }

    /**
     * After using the <code>setRotation</code> function, user needs to call the
     * <code>buildMatrices</code> function
     *
     * @param rotation
     */
    public void setRotation(Matrix3 rotation) {
        this.rotation = rotation;
    }

    public Matrix4 getWorldMatrix() {
        return mtWorld;
    }
    
    public ReadOnlyTransform getWorldTransform() {
        return mtTransform;
    }
    public void setWorldTransform(ReadOnlyTransform transform) {
        mtTransform = transform;
    }
    public ReadOnlyTransform getNormalTransform() {
        return mtNormalTransform;
    }
    public void setNormalTransform(ReadOnlyTransform transform) {
        mtNormalTransform = transform;
    }

    public Matrix4 getNormalMatrix() {
        return mtNormal;
    }

	public boolean isTransformed() {
		return transformed;
	}

	public void setTransformed(boolean transformed) {
		this.transformed = transformed;
		parent.setNeedsPrecommit(true);
	}

	public boolean isVisible() {
		return visible;
	}

	public void setVisible(boolean visible) {
		if( this.visible != visible ) {
			setTransformed(true);	// Changed
			this.visible = visible;
		}
		
	}
}