/**
 * Copyright (c) 2008-2010 Ardor Labs, Inc.
 *
 * This file is part of Ardor3D.
 *
 * Ardor3D is free software: you can redistribute it and/or modify it
 * under the terms of its license which may be found in the accompanying
 * LICENSE file or at <http://www.ardor3d.com/LICENSE>.
 */

package org.jcrpg.threed.engine.effects;

import java.io.IOException;
import java.util.logging.Level;
import java.util.logging.Logger;

import com.ardor3d.framework.DisplaySettings;
import com.ardor3d.image.Texture;
import com.ardor3d.image.Texture2D;
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
import com.ardor3d.scenegraph.Node;
import com.ardor3d.scenegraph.Renderable;
import com.ardor3d.scenegraph.Spatial;
import com.ardor3d.scenegraph.hint.CullHint;
import com.ardor3d.scenegraph.hint.LightCombineMode;
import com.ardor3d.scenegraph.hint.TextureCombineMode;
import com.ardor3d.scenegraph.shape.Quad;

/**
 * Throttled fullscreenquad renderer pass, for not so frequently rendered parts like UI
 */
public class ThrottledQuadRenderPass extends Pass {
    /** The Constant logger. */
    private static final Logger logger = Logger.getLogger(ThrottledQuadRenderPass.class.getName());

    private static final long serialVersionUID = 1L;

    private double throttle = 1d/30d;
    private double sinceLast = 1;
    
    public void forceUpdate()
    {
    	sinceLast = throttle+1d;
    }

    private TextureRenderer tRenderer = null;
    private Texture2D mainTexture = null;

    private Quad fullScreenQuad = null;

    private GLSLShaderObjectsState finalShader = null;

    private final Camera cam;
    private final int renderScale;

    private boolean supported = true;

    public static String shaderDirectory = "com/ardor3d/extension/effect/bloom/";

    private boolean initialized = false;

    /**
     * Reset bloom parameters to default
     */
    public void resetParameters() {
    }

    /**
     * Release pbuffers in TextureRenderer's. Preferably called from user cleanup method.
     */
    public void cleanup() {
        super.cleanUp();
        if (tRenderer != null) {
            tRenderer.cleanup();
        }
    }

    public boolean isSupported() {
        return supported;
    }

    /**
     * Creates a new bloom renderpass
     * 
     * @param cam
     *            Camera used for rendering the bloomsource
     * @param renderScale
     *            Scale of bloom texture
     */
    public ThrottledQuadRenderPass(final Camera cam, final int renderScale) {
        this.cam = cam;
        this.renderScale = renderScale;
        resetParameters();
    }

    /**
     * Helper class to get all spatials rendered in one TextureRenderer.render() call.
     */
    private class SpatialsRenderNode extends Node {
        private static final long serialVersionUID = 7367501683137581101L;

        @Override
        public void draw(final Renderer r) {
            Spatial child;
            for (int i = 0, cSize = _spatials.size(); i < cSize; i++) {
                child = _spatials.get(i);
                if (child != null) {
                    child.onDraw(r);
                }
            }
        }

        @Override
        public void onDraw(final Renderer r) {
            draw(r);
        }
    }

    private final SpatialsRenderNode spatialsRenderNode = new SpatialsRenderNode();

    @Override
    protected void doUpdate(final double tpf) {
        super.doUpdate(tpf);
        sinceLast += tpf;
    }

    @Override
    public void doRender(final Renderer r) {
        if (!initialized) {
            doInit(r);
        }
        if (_spatials.size() == 0) {
            return;
        }
        final BlendState blend = (BlendState) fullScreenQuad.getWorldRenderState(RenderState.StateType.Blend);
        if (sinceLast > throttle) {
            sinceLast = 0;
            tRenderer.getCamera().setLocation(cam.getLocation());
            tRenderer.getCamera().setDirection(cam.getDirection());
            tRenderer.getCamera().setUp(cam.getUp());
            tRenderer.getCamera().setLeft(cam.getLeft());
            blend.setEnabled(false);
            final TextureState ts = (TextureState) fullScreenQuad.getWorldRenderState(RenderState.StateType.Texture);
            // Render scene to texture
            tRenderer.render(spatialsRenderNode, mainTexture, Renderer.BUFFER_COLOR);
            ts.setTexture(mainTexture, 0);
        }                
        // Final blend
        blend.setEnabled(true);

        fullScreenQuad.setRenderState(finalShader);
        fullScreenQuad.updateWorldRenderStates(false);

        r.draw((Renderable) fullScreenQuad);
    }

    private void doInit(final Renderer r) {
        initialized = true;

        // Test for glsl support
        final ContextCapabilities caps = ContextManager.getCurrentContext().getCapabilities();
        if (!caps.isGLSLSupported() || !(caps.isPbufferSupported() || caps.isFBOSupported())) {
            supported = false;
            return;
        }

        // Create texture renderers and rendertextures(alternating between two not to overwrite pbuffers)
        final DisplaySettings settings = new DisplaySettings(cam.getWidth() / renderScale, cam.getHeight()
                / renderScale, 24, 0, 0, 8, 0, 0, false, false);
        tRenderer = TextureRendererFactory.INSTANCE.createTextureRenderer(settings, false, r, ContextManager
                .getCurrentContext().getCapabilities());

        if (tRenderer == null) {
            supported = false;
            return;
        }
        tRenderer.setMultipleTargets(true);
        tRenderer.setBackgroundColor(new ColorRGBA(1.0f, 1.0f, 1.0f, 0.0f));
        tRenderer.getCamera().setFrustum(cam.getFrustumNear(), cam.getFrustumFar(), cam.getFrustumLeft(),
                cam.getFrustumRight(), cam.getFrustumTop(), cam.getFrustumBottom());

        mainTexture = new Texture2D();
        mainTexture.setWrap(Texture.WrapMode.Clamp);
        mainTexture.setMagnificationFilter(Texture.MagnificationFilter.Bilinear);
        tRenderer.setupTexture(mainTexture);


        // Create final shader(basic texturing)
        finalShader = new GLSLShaderObjectsState();
        try {
            finalShader.setVertexShader(ThrottledQuadRenderPass.class.getClassLoader().getResourceAsStream(
                    shaderDirectory + "bloom_final.vert"));
            finalShader.setFragmentShader(ThrottledQuadRenderPass.class.getClassLoader().getResourceAsStream(
                    shaderDirectory + "bloom_final.frag"));
        } catch (final IOException ex) {
            logger.logp(Level.SEVERE, getClass().getName(), "init(Renderer)", "Could not load shaders.", ex);
        }

        // Create fullscreen quad
        fullScreenQuad = new Quad("FullScreenQuad", cam.getWidth() / 4, cam.getHeight() / 4);
        fullScreenQuad.setTranslation(cam.getWidth() / 2, cam.getHeight() / 2, 0);
        fullScreenQuad.getSceneHints().setRenderBucketType(RenderBucketType.Ortho);

        fullScreenQuad.getSceneHints().setCullHint(CullHint.Never);
        fullScreenQuad.getSceneHints().setTextureCombineMode(TextureCombineMode.Replace);
        fullScreenQuad.getSceneHints().setLightCombineMode(LightCombineMode.Off);

        final TextureState ts = new TextureState();
        ts.setEnabled(true);
        fullScreenQuad.setRenderState(ts);

        final BlendState as = new BlendState();
        as.setBlendEnabled(true);
		as.setSourceFunction(BlendState.SourceFunction.SourceAlpha);
		as.setDestinationFunction(BlendState.DestinationFunction.OneMinusSourceAlpha);

   //     as.setSourceFunction(BlendState.SourceFunction.One);
   //     as.setDestinationFunction(BlendState.DestinationFunction.One);
        as.setEnabled(true);
        fullScreenQuad.setRenderState(as);

        fullScreenQuad.updateGeometricState(0.0f, true);
    }

    /**
     * @return The throttle amount - or in other words, how much time in seconds must pass before the bloom effect is
     *         updated.
     */
    public double getThrottle() {
        return throttle;
    }

    /**
     * @param throttle
     *            The throttle amount - or in other words, how much time in seconds must pass before the bloom effect is
     *            updated.
     */
    public void setThrottle(final float throttle) {
        this.throttle = throttle;
    }
}
