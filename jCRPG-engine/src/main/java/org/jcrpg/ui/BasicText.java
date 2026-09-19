package org.jcrpg.ui;

import com.ardor3d.math.MathUtils;
import com.ardor3d.math.Matrix3;
import com.ardor3d.ui.text.BMFont;
import com.ardor3d.util.resource.URLResourceSource;

public class BasicText extends com.ardor3d.ui.text.BasicText {
    
	
	static boolean DEFAULT_FONT_OVERLOADED = false;
	
	private static void overload()
	{
		try {
	        DEFAULT_FONT = new BMFont(new URLResourceSource(BasicText.class.getClassLoader().getResource(
	        		"org/jcrpg/ui/vinque.fnt")), true);
	    } catch (final Exception ex) {
	    	ex.printStackTrace();
	        //logger.throwing(BasicText.class.getCanonicalName(), "static font init", ex);
	    }
	    DEFAULT_FONT_OVERLOADED = true;
		
	}

	public BasicText(String name, String text, BMFont font, double fontSize) {
		super(name, text, font, fontSize);
	}
    public static BasicText createDefaultTextLabel(final String name, final String text, final double fontSize) {
//        return new BasicText(name, text, DEFAULT_FONT, fontSize);
    	if (!DEFAULT_FONT_OVERLOADED) overload();
        BasicText t = new BasicText(name, text, DEFAULT_FONT, fontSize);
        t.setRotation(new Matrix3().fromAngles(MathUtils.HALF_PI, 0, 0));
        DEFAULT_FONT_SIZE = 20D;
        return t;
    }

    public static BasicText createDefaultTextLabel(final String name, final String text) {
    	if (!DEFAULT_FONT_OVERLOADED) overload();
        BasicText t = new BasicText(name, text, DEFAULT_FONT, DEFAULT_FONT_SIZE);
        t.setRotation(new Matrix3().fromAngles(MathUtils.HALF_PI, 0, 0));
        return t;
    }

	public float getCenterOrigoX(double centerX, float ratio) {
		double c = centerX - (getWidth2() / 2) * (ratio) * 1.00f;
		if (c < 0)
			c = 0;
		return (float) c;
	}

	public float getWidth2() {
		return getWidth();
	}
   
    public float getHeight2() {
    float rVal = 16f;
    return rVal;
    }

}
