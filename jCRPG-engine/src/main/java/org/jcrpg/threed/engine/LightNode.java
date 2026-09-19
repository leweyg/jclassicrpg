/*
 * Copyright (c) 2003-2009 jMonkeyEngine
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are
 * met:
 *
 * * Redistributions of source code must retain the above copyright
 *   notice, this list of conditions and the following disclaimer.
 *
 * * Redistributions in binary form must reproduce the above copyright
 *   notice, this list of conditions and the following disclaimer in the
 *   documentation and/or other materials provided with the distribution.
 *
 * * Neither the name of 'jMonkeyEngine' nor the names of its contributors 
 *   may be used to endorse or promote products derived from this software 
 *   without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
 * "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED
 * TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR
 * PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR
 * CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL,
 * EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO,
 * PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR
 * PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF
 * LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING
 * NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
 * SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

package org.jcrpg.threed.engine;

import java.io.IOException;

import com.ardor3d.light.DirectionalLight;
import com.ardor3d.light.Light;
import com.ardor3d.light.PointLight;
import com.ardor3d.light.SpotLight;
import com.ardor3d.math.Vector3;
import com.ardor3d.scenegraph.Node;
import com.ardor3d.util.export.Ardor3dExporter;
import com.ardor3d.util.export.Ardor3dImporter;
import com.ardor3d.util.export.InputCapsule;
import com.ardor3d.util.export.OutputCapsule;

/**
 * <code>LightNode</code> defines a scene node that contains and maintains a
 * light object. A light node contains a single light, and positions the light
 * based on it's translation vector.<br>
 * If the contained light is a spot light, the rotation of the node 
 * determines it's direction. It has no concept of location.<br>
 * If the contained light is a Directional light, the direction is relative
 * to the LightNodes world translation. If the light node is located at
 * (0,0,0) the DirectionalLight will have no direction and the Light will be
 * disabled.
 * 
 * @author Mark Powell
 * @version $Id: LightNode.java 4131 2009-03-19 20:15:28Z blaine.dev $
 */
public class LightNode extends Node {

    private static final long serialVersionUID = 1L;

    private Light light;

    public LightNode() {}

    /**
     * Constructor creates a new <code>LightState</code> object. The light
     * state the node controls is required at construction time.
     * 
     * @param name
     *            the name of the scene element. This is required for
     *            identification and comparision purposes.
     */
    public LightNode(String name) {
        super(name);
    }

    /**
     * 
     * <code>setLight</code> sets the light of this node. If a light was
     * previously set to the node, it is replaced by this light.
     * 
     * @param light
     *            the light to use for the node.
     */
    public void setLight(Light light) {
        this.light = light;
    }

    /**
     * 
     * <code>getLight</code> returns the light object this node is
     * controlling.
     * 
     * @return the light object of the node.
     */
    public Light getLight() {
        return light;
    }

    @Override
	public void updateGeometricState(double time) {
		// TODO Auto-generated method stub
		super.updateGeometricState(time);
        if(light == null) {
            return;
        }
        switch (light.getType()) {
        case Directional: {
            DirectionalLight dLight = (DirectionalLight) light;
            dLight.setDirection(new Vector3(getWorldTranslation()).negateLocal());
            break;
        }

        case Point: {
            PointLight pLight = (PointLight) light;
            pLight.setLocation(new Vector3(getWorldTranslation()));
            break;
        }

        case Spot: {
            SpotLight sLight = (SpotLight) light;
            sLight.setLocation(new Vector3(getWorldTranslation()));
           // sLight.getLocation().set(worldTranslation);
            // TODO worldRotation.getRotationColumn(2, sLight.getDirection());
            break;
        }

        default:
            break;
        }	
        
    }


    
    @Override
    public String toString() {
        String lightType = null;
        if (getLight() != null)
            switch (getLight().getType()) {
                case Directional:
                    lightType = "Directional";
                    break;
                case Point:
                    lightType = "Point";
                    break;
                case Spot:
                    lightType = "Spot";
                    break;
            }
        return getName() +" ("+ lightType+")";
    }
    
    public void write(Ardor3dExporter e) throws IOException {
        /*super.write(e);
        OutputCapsule capsule = e.getCapsule(this);
        capsule.write(light, "light", null);*/
    }
    
    public void read(Ardor3dImporter e) throws IOException {
        /*super.read(e);
        InputCapsule capsule = e.getCapsule(this);
        light = (Light)capsule.readSavable("light", null);*/
    }
}
