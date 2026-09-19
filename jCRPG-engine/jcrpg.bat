
set JAR_FONTTT=./lib/fonttt-a3d.jar
set JAR_GCOLLECT=./lib/google-collect-1.0.jar
set JAR_JME2=./lib/jme2/jme.jar
set JAR_JME2AUDIO=./lib/jme2/jme-audio.jar
set JAR_JORBIS=./lib/jorbis-0.0.17.jar
set JAR_LWJGL=./lib/lwjgl/lwjgl.jar
set JAR_JINPUT=./lib/lwjgl/jinput.jar
set JAR_MD5READER2=./lib/md5reader2-a3d.jar
set JAR_NANOXML=./lib/nanoxml/nanoxml-2.2.3.jar
set JAR_SLICK=./lib/slick-1.0.jar
set JAR_XSTREAM=./lib/xstream/xstream-1.3.1.jar
set JAR_ARDOR_CORE=./lib/ardor3d/ardor3d-core-0.7-SNAPSHOT.jar
set JAR_ARDOR_EFFECTS=./lib/ardor3d/ardor3d-effects-0.7-SNAPSHOT.jar
set JAR_ARDOR_LWJGL=./lib/ardor3d/ardor3d-lwjgl-0.7-SNAPSHOT.jar
set JAR_ARDOR_JOGL=./lib/ardor3d/ardor3d-jogl-0.7-SNAPSHOT.jar
set JAR_ARDOR_AWT=./lib/ardor3d/ardor3d-awt-0.7-SNAPSHOT.jar
set JAR_ARDOR_EXTRAS=./lib/ardor3d/ardor3d-extras-0.7-SNAPSHOT.jar
set JAR_JFCL=./lib/jfcl-0.9.5_all.jar


java -Xloggc:./log/gc.log -verbose:gc -XX:+PrintGCDetails -XX:+PrintGCTimeStamps -XX:+UseParNewGC -XX:+PrintGCApplicationConcurrentTime -XX:+PrintGCApplicationStoppedTime -Xmx500m -Djava.library.path=./lib/native -cp ./target/jCRPG-engine-1.0-SNAPSHOT.jar;%JAR_FONTTT%;%JAR_GCOLLECT%;%JAR_JME2%;%JAR_JME2AUDIO%;%JAR_LWJGL%;%JAR_JINPUT%;%JAR_MD5READER2%;%JAR_NANOXML%;%JAR_SLICK%;%JAR_XSTREAM%;%JAR_JORBIS%;%JAR_ARDOR_CORE%;%JAR_ARDOR_EFFECTS%;%JAR_ARDOR_ANIMATION%;%JAR_ARDOR_LWJGL%;%JAR_ARDOR_JOGL%;%JAR_ARDOR_AWT%;%JAR_ARDOR_EXTRAS%;%JAR_JFCL% org.jcrpg.apps.Jcrpg %1

