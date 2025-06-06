import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Image,
  TouchableWithoutFeedback,
  Dimensions,
} from 'react-native';

const screenWidth = Dimensions.get('window').width;
const screenHeight = Dimensions.get('window').height;

export default function App(): JSX.Element {
  const [ballY, setBallY] = useState<number>(screenHeight - 100);
  const [velocity, setVelocity] = useState<number>(0);
  const [isShot, setIsShot] = useState<boolean>(false);
  const [score, setScore] = useState<number>(0);

  const hoopY = 100;
  const hoopX = screenWidth / 2 - 50;

  const shoot = (): void => {
    if (!isShot) {
      setVelocity(-20);
      setIsShot(true);
    }
  };

  const resetBall = (): void => {
    setBallY(screenHeight - 100);
    setVelocity(0);
    setIsShot(false);
  };

  useEffect(() => {
    const interval = setInterval(() => {
      if (isShot) {
        setBallY((prevY) => {
          const nextY = prevY + velocity;
          if (nextY >= screenHeight - 100) {
            resetBall();
            return screenHeight - 100;
          }
          return nextY;
        });
        setVelocity((prevV) => prevV + 2); // gravity
      }
    }, 50);

    return () => clearInterval(interval);
  }, [isShot, velocity]);

  useEffect(() => {
    if (ballY < hoopY + 20 && ballY > hoopY - 20 && isShot) {
      setScore((prev) => prev + 1);
      resetBall();
    }
  }, [ballY]);

  return (
    <TouchableWithoutFeedback onPress={shoot}>
      <View style={styles.container}>
        <Text style={styles.score}>Score: {score}</Text>
        <View style={[styles.hoop, { top: hoopY, left: hoopX }]} />
        <Image
          source={require('../assets/basketball.png')} // adjust path if needed
          style={[styles.ball, { top: ballY }]}
        />
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  hoop: {
    position: 'absolute',
    width: 100,
    height: 10,
    backgroundColor: 'red',
    borderRadius: 5,
  },
  ball: {
    position: 'absolute',
    width: 60,
    height: 60,
    resizeMode: 'contain',
  },
  score: {
    fontSize: 30,
    marginTop: 50,
  },
});
