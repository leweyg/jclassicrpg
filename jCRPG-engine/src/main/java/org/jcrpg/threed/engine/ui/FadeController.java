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

package org.jcrpg.threed.engine.ui;

import java.io.File;

import org.jcrpg.apps.Jcrpg;
import org.jcrpg.threed.J3DCore;
import org.jcrpg.threed.PooledNode;

import com.ardor3d.renderer.state.BlendState;
import com.ardor3d.renderer.state.FragmentProgramState;
import com.ardor3d.renderer.state.MaterialState;
import com.ardor3d.renderer.state.VertexProgramState;
import com.ardor3d.renderer.state.RenderState.StateType;
import com.ardor3d.scenegraph.Node;
import com.ardor3d.scenegraph.Spatial;
import com.ardor3d.scenegraph.controller.SpatialController;

public class FadeController implements SpatialController<Spatial> {

	/**
	 * 
	 */
	private static final long serialVersionUID = 1L;

	Node node;
	
	PooledNode pooleadRealNode;
	
	
	static VertexProgramState vp = null;
	FragmentProgramState fp = null;
	
	public static BlendState blendState;
	
	public BlendState originalBlendState;
	public MaterialState originalMatState;


	public FadeController(PooledNode pooledRealNode, Node node,float fadeTimeInSeconds, FadeMode mode)
	{
		
		{
			if (vp==null)
			{
	        	vp = new VertexProgramState();
	            try {vp.load(new File(
	                    "../media/shaders/fader.vp").toURI().toURL());} catch (Exception ex){}
	            vp.setEnabled(true);
	            try {
		            //if (!vp.isSupported())
		            {
		            	if (J3DCore.LOGGING()) Jcrpg.LOGGER.warning("!!!!!!! NO VP !!!!!!!");
		            }
	            } catch (Exception ex)
	            {
	            	vp = null;
	            }

			}
        	fp = new FragmentProgramState();
            try {fp.load(new File(
                    "../media/shaders/fader.fp").toURI().toURL());} catch (Exception ex){}
            fp.setEnabled(true);
            try {
	            //if (!fp.isSupported())
	            {
	            	if (J3DCore.LOGGING()) Jcrpg.LOGGER.warning("!!!!!!! NO FP !!!!!!!");
	            }
            } catch (Exception ex)
            {
            	fp = null;
            }
		}
		
		
		
		if (blendState==null)
		{
			BlendState as;// = J3DCore.getInstance().as;
			as = new BlendState();
			as.setEnabled(true);
			as.setBlendEnabled(true);
			as.setSourceFunction(BlendState.SourceFunction.SourceAlpha);
			as.setDestinationFunction(BlendState.DestinationFunction.OneMinusSourceAlpha);
			as.setReference(1.0f);
			as.setTestFunction(BlendState.TestFunction.GreaterThan);// GREATER is good only
			blendState = as;
		}
		this.node = node;
		originalBlendState = (BlendState)node.getLocalRenderState(StateType.Blend);

		this.mode = mode;
		if (mode == FadeMode.FadingOut)
		{
			alpha = 1.0f;
		} else
		{
			alpha = 0.0f;
		}

		{
			node.setRenderState(vp);
			node.setRenderState(fp);
			fp.setParameter(new float[]{alpha,1,1,1}, 0);
		}
		node.setRenderState(blendState);
		// TODO node.updateRenderState();
		this.pooleadRealNode = pooledRealNode;
		this.fadeTimeInSeconds = fadeTimeInSeconds;
	}
	
    public enum FadeMode {
        Disabled,
        FadingOut,
        FadingIn;
    }

    FadeMode mode = FadeMode.Disabled;
    private float alpha;
	private float fadeTimeInSeconds;

	
	
	
	public void update(double time, Spatial s) {
        if ((mode == FadeMode.FadingOut) && (alpha > 0.0f)) {
            alpha -= 1 / (fadeTimeInSeconds / time);
            if (alpha < 0.0f) alpha = 0.0f;
            fp.setParameter(new float[]{alpha,0,0,0}, 0);
            if (alpha == 0.0f)
            {
            	Node realNode = (Node)pooleadRealNode;
				if (J3DCore.SETTINGS.SHADOWS) J3DCore.getInstance().removeOccludersRecoursive(realNode);
            	J3DCore.getInstance().modelPool.releaseNode(pooleadRealNode);
            	node.removeFromParent();
            	node.setRenderState(originalBlendState);
            	if (originalBlendState==null)
            	{
            		node.clearRenderState(StateType.Blend);
            	}
            	{
            		node.clearRenderState(StateType.VertexProgram);
            		node.clearRenderState(StateType.FragmentProgram);
            	} 
            	
            	J3DCore.toRemoveControllers.add(this);
            }
        } else if ((mode == FadeMode.FadingIn) && (alpha < 1.0f)) {
            alpha += 1 / (fadeTimeInSeconds / time);
            if (alpha > 1.0f) alpha = 1.0f;
            {
        		fp.setParameter(new float[]{alpha,0,0,0}, 0);
            }
            if (alpha == 1.0f)
            {
            	node.setRenderState(originalBlendState);
            	if (originalBlendState==null)
            	{
            		node.clearRenderState(StateType.Blend);
            	}
            	{
            		node.clearRenderState(StateType.VertexProgram);
            		node.clearRenderState(StateType.FragmentProgram);
            	}
            	
            	J3DCore.toRemoveControllers.add(this);
            }
        } 
	}
	


}
