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
package org.jcrpg.threed.engine.program.impl;

import org.jcrpg.threed.J3DCore;
import org.jcrpg.threed.engine.program.EffectNode;

import com.ardor3d.extension.effect.particle.ParticlePoints;
import com.ardor3d.extension.effect.particle.ParticleSystem.ParticleType;
import com.ardor3d.math.FastMath;
import com.ardor3d.math.Matrix3;
import com.ardor3d.math.Vector3;

public class FireDots extends EffectNode {

	private com.ardor3d.extension.effect.particle.ParticlePoints pPoints;
	//private Box debugBox;

	/**
	 * 
	 */
	private static final long serialVersionUID = 1L;

	public FireDots()
	{
		pPoints = (ParticlePoints)com.ardor3d.extension.effect.particle.ParticleFactory.buildParticles("particles", 300, ParticleType.Point);
		pPoints.setPointSize(5);
		pPoints.setAntialiased(true);
		pPoints.setEmissionDirection(new Vector3(0, 1, 0));
		pPoints.setOriginOffset(new Vector3(0, 0, 0));
		pPoints.setInitialVelocity(.006f);
		pPoints.setStartSize(2.5f);
		pPoints.setEndSize(.5f);
		pPoints.setMinimumLifeTime(1200f);
		pPoints.setMaximumLifeTime(1400f);
		pPoints.setStartColor(new com.ardor3d.math.ColorRGBA(1, 0, 0, 1));
		pPoints.setEndColor(new com.ardor3d.math.ColorRGBA(0, 1, 0, 0));
		pPoints.setMaximumAngle(360f * Math.PI/180d);
		pPoints.getParticleController().setControlFlow(false);
		pPoints.warmUp(120);

		com.ardor3d.renderer.state.BlendState as1 = J3DCore.getInstance().modelLoader.alphaStateParticleEffectBase;
		com.ardor3d.renderer.state.ZBufferState zstate = J3DCore.getInstance().modelLoader.zBufferStateOff;

		this.setRenderState(as1);
		pPoints.setRenderState(zstate);


		//debugBox = new Box("box",new Vector3f(1f,1f,1f),new Vector3f(1f,1f,1f));
		//debugBox.setModelBound(new BoundingBox());
		//debugBox.updateModelBound();

		//this.attachChild(debugBox);

		this.attachChild(pPoints);
	}


	@Override
	public void setPosition(Vector3 newPos, Matrix3 newAngle) {
		currentPos = newPos;
		if (pPoints!=null)
			pPoints.setOriginOffset(currentPos);
		super.setPosition(newPos,newAngle);
	}

}
