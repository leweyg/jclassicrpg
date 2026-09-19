/*
 * Copyright (c) 2003-2008 jMonkeyEngine
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

package org.jcrpg.threed.engine.effects;

import java.io.IOException;

import org.jcrpg.threed.J3DCore;

import com.ardor3d.framework.DisplaySettings;
import com.ardor3d.image.Texture;
import com.ardor3d.image.Texture2D;
import com.ardor3d.image.TextureStoreFormat;
import com.ardor3d.math.ColorRGBA;
import com.ardor3d.renderer.Camera;
import com.ardor3d.renderer.ContextCapabilities;
import com.ardor3d.renderer.ContextManager;
import com.ardor3d.renderer.Renderer;
import com.ardor3d.renderer.TextureRenderer;
import com.ardor3d.renderer.TextureRendererFactory;
import com.ardor3d.renderer.pass.Pass;
import com.ardor3d.renderer.queue.RenderBucketType;
import com.ardor3d.renderer.state.BlendState;
import com.ardor3d.renderer.state.GLSLShaderObjectsState;
import com.ardor3d.renderer.state.RenderState;
import com.ardor3d.renderer.state.TextureState;
import com.ardor3d.scenegraph.Mesh;
import com.ardor3d.scenegraph.Renderable;
import com.ardor3d.scenegraph.Spatial;
import com.ardor3d.scenegraph.hint.CullHint;
import com.ardor3d.scenegraph.hint.LightCombineMode;
import com.ardor3d.scenegraph.hint.TextureCombineMode;
import com.ardor3d.scenegraph.shape.Quad;

/**
 * GLSL Depth of Field effect pass. - Creating a depth texture with a root Spatial and its subspatials - 
 * Use it on full screen texture downsampled
 * to blur it with stronger opacity and blurring on far away parts - 
 * render result (unblended) on the screen overwriting
 * with the blurred parts. 
 * 
 * @author Paul Illes - initial implementation of DepthOfFieldRenderPass for jME 1.0 based on partially MrCorder's 
 *	shaders plus : about original Ogre DoF demo: 
 *  "Depth of Field" demo for Ogre
 *  Copyright (C) 2006  Christian Lindequist Larsen
 *  This code is in the public domain. You may do whatever you want with it.
 *  - Used from that part the depth shader with some modifications. 
 *  
 * @author (MrCoder) - initial implementation of BloomRenderPass (original pass)
 * @author Joshua Slack - Enhancements and reworking to use a single
 *         texrenderer, ability to reuse existing back buffer, faster blur,
 *         throttling speed-up, etc.
 */
public class DepthOfFieldRenderPass extends Pass {
    private static final long serialVersionUID = 1L;

    private float throttle = 1/50f; 
    private float sinceLast = 1; 
    
    private TextureRenderer tRenderer;
    private TextureRenderer fullTRenderer;
	private Texture2D resultTexture;
	private Texture2D depthTexture;
    private Texture2D screenTexture;

    private Quad fullScreenQuad;
	private Mesh fullScreenQuadBatch;

	private GLSLShaderObjectsState finalShader;
	private GLSLShaderObjectsState depthShader;
	private GLSLShaderObjectsState dofShader;

	
	private float blurSize;

	public float nearBlurDepth = 10f;
    public float focalPlaneDepth = 25f;
    public float farBlurDepth = 50f;
    /** blurriness cutoff constant for objects behind the focal plane */
    public float blurrinessCutoff = 1f;

	private boolean supported = true;

	public static String shaderDirectory = "org/jcrpg/threed/jme/effects/shader/";

	/**
	 * Reset bloom parameters to default
	 */
	public void resetParameters() {
		nearBlurDepth = 10f;
		focalPlaneDepth = 25f;
		farBlurDepth = 50f;
		blurrinessCutoff = 50f;
		blurSize = 0.013f;
	}

	/**
	 * Release pbuffers in TextureRenderer's. Preferably called from user cleanup method.
	 */
	public void cleanup() {
        super.cleanUp();
        if (tRenderer != null)
            tRenderer.cleanup();
	}

	public boolean isSupported() {
		return supported;
	}
	
	boolean initialized = false;
	
    private void doInit(final Renderer r) {
        initialized = true;

        // Test for glsl support
        final ContextCapabilities caps = ContextManager.getCurrentContext().getCapabilities();
        if (!caps.isGLSLSupported() || !(caps.isPbufferSupported() || caps.isFBOSupported())) {
            supported = false;
            return;
        }
        
        
        if (screenTexture == null) {
            final DisplaySettings settings = new DisplaySettings(cam.getWidth(), cam.getHeight(), 0, 0, 0, 8,
                    0, 0, false, false);
            fullTRenderer = TextureRendererFactory.INSTANCE.createTextureRenderer(settings, false, r,
                    ContextManager.getCurrentContext().getCapabilities());
            screenTexture = new Texture2D();
            screenTexture.setWrap(Texture.WrapMode.Clamp);
            screenTexture.setMagnificationFilter(Texture.MagnificationFilter.Bilinear);
            fullTRenderer.setupTexture(screenTexture);
        }
        // Create texture renderers and rendertextures(alternating between two not to overwrite pbuffers)
        final DisplaySettings settings = new DisplaySettings(cam.getWidth() / renderScaleP, cam.getHeight()
                / renderScaleP, 0, 0, 0, 8, 0, 0, false, false);
        tRenderer = TextureRendererFactory.INSTANCE.createTextureRenderer(settings, false, r, ContextManager
                .getCurrentContext().getCapabilities());
        if (tRenderer == null) {
            supported = false;
            return;
        }
        tRenderer.setMultipleTargets(true);
        tRenderer.setBackgroundColor(new ColorRGBA(0.0f, 0.0f, 0.0f, 1.0f));
        tRenderer.getCamera().setFrustum(cam.getFrustumNear(), cam.getFrustumFar(), cam.getFrustumLeft(),
                cam.getFrustumRight(), cam.getFrustumTop(), cam.getFrustumBottom());

        
        	/*display.createTextureRenderer(
                display.getWidth()/ originalScale, 
                display.getHeight()/ originalScale,
                TextureRenderer.Target.Texture2D);*/

        tRenderer.setBackgroundColor(new ColorRGBA(0.0f, 0.0f, 0.0f, 1.0f));

		resultTexture = new Texture2D();
		resultTexture.setWrap(Texture.WrapMode.Clamp);
		resultTexture.setMagnificationFilter(Texture.MagnificationFilter.Bilinear);
		tRenderer.setupTexture(resultTexture);


        depthTexture = new Texture2D();
		depthTexture.setWrap(Texture.WrapMode.Clamp);
        screenTexture.setMagnificationFilter(Texture.MagnificationFilter.NearestNeighbor);
		tRenderer.setupTexture(depthTexture);

        try {
			//Create final shader(basic texturing)
			finalShader = new GLSLShaderObjectsState();
			finalShader.setVertexShader(DepthOfFieldRenderPass.class.getClassLoader().getResource(shaderDirectory + "dof_fullscreen.vert").openStream());
			finalShader.setFragmentShader(DepthOfFieldRenderPass.class.getClassLoader().getResource(shaderDirectory + "dof_fullscreen.frag").openStream());
			finalShader.setEnabled(true);
	
			// DOF
			depthShader = new GLSLShaderObjectsState();
			if (J3DCore.NVIDIA)
			{
				depthShader.setVertexShader(DepthOfFieldRenderPass.class.getClassLoader().getResource(shaderDirectory + "dof_1_depth_nv.vert").openStream());
				depthShader.setFragmentShader(DepthOfFieldRenderPass.class.getClassLoader().getResource(shaderDirectory + "dof_1_depth_nv.frag").openStream());
			} else
			{
				depthShader.setVertexShader(DepthOfFieldRenderPass.class.getClassLoader().getResource(shaderDirectory + "dof_1_depth.vert").openStream());
				depthShader.setFragmentShader(DepthOfFieldRenderPass.class.getClassLoader().getResource(shaderDirectory + "dof_1_depth.frag").openStream());
			}
			depthShader.setEnabled(true);
			//Create dof shader
			dofShader = new GLSLShaderObjectsState();
			dofShader.setVertexShader(DepthOfFieldRenderPass.class.getClassLoader().getResource(shaderDirectory + "dof_simple.vert").openStream());
			dofShader.setFragmentShader(DepthOfFieldRenderPass.class.getClassLoader().getResource(shaderDirectory + "dof_3_dof_2.frag").openStream());
			dofShader.setEnabled(true);
        } catch (IOException ioex)
        {
        	ioex.printStackTrace();
        	supported = false;
        	return;
        }
			
		//Create fullscreen quad
		fullScreenQuad = new Quad("FullScreenQuad", cam.getWidth()/4, cam.getHeight()/4);
        fullScreenQuadBatch = fullScreenQuad;
		//fullScreenQuad.setRotation(new Matrix3(0, 0, 0, 1 , 0 , 0 , 0 , 0 , 0));
		fullScreenQuad.setTranslation(cam.getWidth() / 2, cam.getHeight() / 2, 0);
		fullScreenQuad.getSceneHints().setRenderBucketType(RenderBucketType.Ortho);

		fullScreenQuad.getSceneHints().setCullHint(CullHint.Never);
		fullScreenQuad.getSceneHints().setTextureCombineMode(TextureCombineMode.Replace);
		fullScreenQuad.getSceneHints().setLightCombineMode(LightCombineMode.Off);
        
		TextureState ts = new TextureState();
		ts.setEnabled(true);
        fullScreenQuadBatch.setRenderState(ts);

		BlendState as = new BlendState();
		// no blending, result texture has to overwrite screen - not blend!
	    as.setTestEnabled(true);
	    as.setTestFunction(BlendState.TestFunction.GreaterThan);
	    as.setEnabled(true);

        fullScreenQuadBatch.setRenderState(as);

        fullScreenQuad.updateGeometricState(0.0f, true);
    }
	
	int renderScaleP;
	int renderScale;
	int originalScale;
	Camera cam;
	/**
	 * Creates a new bloom renderpass
	 *
	 * @param cam		 Camera used for rendering the bloomsource
	 * @param renderScale Scale of bloom texture
	 */
	public DepthOfFieldRenderPass(Camera cam, int originalScale, int renderScale) {
		renderScaleP = renderScale;
		this.renderScale = renderScale;
		this.originalScale = originalScale;
		this.cam = cam;
		resetParameters();


		
	}
    

    @Override
    protected void doUpdate(double tpf) {
        super.doUpdate(tpf);
        sinceLast += tpf;
    }
 
	
    private Spatial rootSpatial = null;


    public Spatial getRootSpatial() {
		return rootSpatial;
	}
    
    /**
     * Sets the scene's root spacial which is used to render depth texture.
     * @param rootSpatial
     */
    public void setRootSpatial(Spatial rootSpatial) {
		this.rootSpatial = rootSpatial;
	}
    

    Texture2D d2 = null;
    
    @Override
	public void doRender(Renderer r) {
        if (rootSpatial==null) {
            return;
        }
        if (!initialized) doInit(r);

        BlendState as = (BlendState) fullScreenQuad.getWorldRenderState(RenderState.StateType.Blend);//
        //TextureState ts = (TextureState) fullScreenQuadBatch.getLocalRenderStates().get(RenderState.StateType.Texture);//

        as.setEnabled(false);
        tRenderer.getCamera().setLocation(cam.getLocation());
        tRenderer.getCamera().setDirection(cam.getDirection());
        tRenderer.getCamera().setUp(cam.getUp());
        tRenderer.getCamera().setLeft(cam.getLeft());
        final TextureState ts = (TextureState) fullScreenQuad.getWorldRenderState(RenderState.StateType.Texture);

        
        if (throttle<sinceLast)
        {
        	sinceLast = 0;
        	as.setEnabled(false);
	        
	        Spatial s = rootSpatial;
	        
	        // rendering the screen
	        fullTRenderer.copyToTexture(screenTexture, 0 , 0 ,
	              cam.getWidth(), 
	            cam.getHeight() ,
	            0 , 0
	                );
	        
			if (!J3DCore.NVIDIA)
			{

				if (d2 == null) {
					d2 = new Texture2D();
					d2.setTextureStoreFormat(TextureStoreFormat.Depth);
					d2.setWrap(Texture.WrapMode.Clamp);
					//d2
						//	.setMagnificationFilter(Texture.MagnificationFilter.Bilinear);
					fullTRenderer.setupTexture(d2);
				}
				fullTRenderer.copyToTexture(d2, 0, 0, cam.getWidth(), cam
						.getHeight(), 0, 0);
				fullScreenQuadBatch.setRenderState(depthShader);
				ts.setTexture(d2, 0);
				depthShader.setUniform("dofParams", nearBlurDepth,
						focalPlaneDepth, farBlurDepth, blurrinessCutoff);
				// depthShader.setUniform("mainTexture", 0);
				fullScreenQuadBatch.setRenderState(ts);
				fullScreenQuad.updateWorldRenderStates(false);
				tRenderer.render(fullScreenQuad, depthTexture,
						Renderer.BUFFER_NONE); // depth texture

			} else
			{
				// depth
				// context.enforceState(depthShader);
				tRenderer.enforceState(depthShader);
				depthShader.setUniform("dofParams", nearBlurDepth,
						focalPlaneDepth, farBlurDepth, blurrinessCutoff);
				depthShader.setUniform("mainTexture", 0);
				tRenderer.render(s, depthTexture,
						Renderer.BUFFER_COLOR_AND_DEPTH); // depth texture
				tRenderer.clearEnforcedStates();
			}
	        
			// dof
			dofShader.clearUniforms();
			dofShader.setUniform("scene", 0);
			dofShader.setUniform("depth", 1);
			//dofShader.setUniform("sampleDist0", getBlurSize());
			fullScreenQuadBatch.setRenderState(dofShader);
	        ts.setTexture(screenTexture, 0);
	        ts.setTexture(depthTexture,1);
	        fullScreenQuadBatch.setRenderState(ts);
       		fullScreenQuad.updateWorldRenderStates(false);
	        tRenderer.render( fullScreenQuad , resultTexture, Renderer.BUFFER_NONE);
	        
			ts.setTexture(resultTexture,0);
			//ts.setTexture(depthTexture,0);
			ts.setTexture(null, 1);
        }

    	//Final blend
		{
	        as.setEnabled(true);
	        
	        fullScreenQuadBatch.setRenderState(finalShader);
	        fullScreenQuad.updateWorldRenderStates(false);
		}
        r.draw((Renderable)fullScreenQuadBatch);
        
	}

	/**
     * @return The throttle amount - or in other words, how much time in
     *         seconds must pass before the bloom effect is updated.
     */
    public float getThrottle() {
        return throttle;
    }

    /**
     * @param throttle
     *            The throttle amount - or in other words, how much time in
     *            seconds must pass before the bloom effect is updated.
     */
    public void setThrottle(float throttle) {
        this.throttle = throttle;
    }
    

    public float getBlurSize() {
		return blurSize;
	}

	public void setBlurSize(float blurSize) {
		this.blurSize = blurSize;
	}

    public float getNearBlurDepth() {
		return nearBlurDepth;
	}

	public void setNearBlurDepth(float nearBlurDepth) {
		this.nearBlurDepth = nearBlurDepth;
	}

	public float getFocalPlaneDepth() {
		return focalPlaneDepth;
	}

	public void setFocalPlaneDepth(float focalPlaneDepth) {
		this.focalPlaneDepth = focalPlaneDepth;
	}

	public float getFarBlurDepth() {
		return farBlurDepth;
	}

	public void setFarBlurDepth(float farBlurDepth) {
		this.farBlurDepth = farBlurDepth;
	}

	public float getBlurrinessCutoff() {
		return blurrinessCutoff;
	}

	public void setBlurrinessCutoff(float blurrinessCutoff) {
		this.blurrinessCutoff = blurrinessCutoff;
	}
}
