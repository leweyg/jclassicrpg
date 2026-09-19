/*
 *  This file is part of JavaCRPG.
 *  Copyright (C) 2008 Illes Pal Zoltan
 *
 *  JavaCRPG is free software; you can redistribute it and/or modify
 *  it under the terms of the GNU Lesser General Public License as published by
 *  the Free Software Foundation; either version 3 of the License, or
 *  (at your option) any later version.
 *
 *  JavaCRPG is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *  GNU Lesser General Public License for more details.
 *
 *  You should have received a copy of the GNU Lesser General Public License
 *  along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */ 
package org.jcrpg.threed.engine.program;

import java.util.HashMap;

import org.jcrpg.threed.J3DCore;
import org.jcrpg.threed.engine.LightNode;
import org.jcrpg.threed.scene.model.SimpleModel;
import org.jcrpg.world.ai.fauna.VisibleLifeForm;

import com.ardor3d.extension.effect.particle.ParticleSystem;
import com.ardor3d.light.PointLight;
import com.ardor3d.math.ColorRGBA;
import com.ardor3d.math.Matrix3;
import com.ardor3d.math.Vector3;
import com.ardor3d.math.type.ReadOnlyMatrix3;
import com.ardor3d.renderer.state.LightState;
import com.ardor3d.scenegraph.Node;

public abstract class EffectNode extends Node {
	
	public static HashMap< Class<? extends EffectNode>, ParticleSystem> cacheMesh = new HashMap<Class<? extends EffectNode>, ParticleSystem>();

	public static LightNode light = null;
	
	/**
	 * serial version uid
	 */
	private static final long serialVersionUID = 1L;
	
	public float speed = 1f;
	
	public long effectStartTime;
	public Vector3 prevDisplacement;
	
	public Vector3 currentPos = new Vector3(0,0,0);
	
	public Vector3 startingPos = new Vector3(0,0,0);
	
	public Node modelNode = null;
	
	public void setPosition(Vector3 newPos,Matrix3 angle)
	{
		if (modelNode!=null && angle!=null) modelNode.setRotation(angle);
		if (modelNode!=null)
		{
			this.attachChild(modelNode);
			modelNode.setTranslation(newPos);
		}
		if (light!=null && light.getLight().isEnabled())
		{
			light.setTranslation(currentPos);
		}
		
	}
	
	Matrix3 tmp = new Matrix3();
	public ReadOnlyMatrix3 getAngle()
	{
		if (modelNode!=null) return modelNode.getRotation();
		return tmp;
	}
	
	
	public void addModelObject(SimpleModel model)
	{
		modelNode = J3DCore.getInstance().modelLoader.loadNodeOriginal(model, false);
		
	}
	
	public Node getModelNode()
	{
		return modelNode;
	}
	
	public VisibleLifeForm sourceForm = null;
	public VisibleLifeForm targetForm = null;

	public boolean startedPlaying = false;
	
	public void clearUp()
	{
		if (light!=null) 
		{
			light.removeFromParent();
			light.getLight().setEnabled(false);
			J3DCore.getInstance().extLightState.detach(light.getLight());
		}
	}
	
	public static LightNode getLightNode(ColorRGBA color)
	{
		
		if (light==null)
		{
			LightState ls = new LightState();
			light = new LightNode("light");
			PointLight pointLight = new PointLight();
			pointLight.setAttenuate(true);
			pointLight.setConstant(1f);
			pointLight.setQuadratic(0.2f);
			light.setLight(pointLight);
			pointLight.setEnabled(true);
			ls.attach(pointLight);
			
		}
		light.removeFromParent();
		light.getLight().setAmbient(color);
		light.getLight().setEnabled(true);
		J3DCore.getInstance().extLightState.attach(light.getLight());
		return light;
	}

}
