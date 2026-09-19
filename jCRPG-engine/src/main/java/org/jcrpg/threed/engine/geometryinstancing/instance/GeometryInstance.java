package org.jcrpg.threed.engine.geometryinstancing.instance;

import org.jcrpg.threed.engine.geometryinstancing.AABB;

import com.ardor3d.scenegraph.Mesh;

/**
 * <code>GeometryInstance</code> uses <code>GeometryInstanceAttributes</code>
 * to define an instance of object in world space.
 *
 * @author Patrik Lindegran
 */
public abstract class GeometryInstance<T extends GeometryInstanceAttributes> {
    protected T attributes;

    public abstract boolean preCommit(boolean force);
    
    public abstract void commit(Mesh batch, boolean force);

    public abstract int getNumIndices();

    public abstract int getNumVerts();
    
    public abstract AABB getModelBound();

    public GeometryInstance(T attributes) {
        this.attributes = attributes;
    }

    public T getAttributes() {
        return attributes;
    }
}