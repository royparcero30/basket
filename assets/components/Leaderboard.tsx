import React from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet, Image, Dimensions } from 'react-native';

interface LeaderboardEntry {
  name: string;
  score: number;
}

interface LeaderboardProps {
  visible: boolean;
  leaderboard: LeaderboardEntry[];
  onClose: () => void;
}

const trophy = require('../trophy.png'); // Optional: add a trophy icon in your assets

const Leaderboard: React.FC<LeaderboardProps> = ({ visible, leaderboard, onClose }) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Image source={trophy} style={styles.trophy} />
            <Text style={styles.title}>🏆 Leaderboard 🏆</Text>
          </View>
          {leaderboard.length === 0 ? (
            <Text style={styles.empty}>No scores yet.</Text>
          ) : (
            leaderboard.map((entry, idx) => (
              <View
                key={idx}
                style={[
                  styles.row,
                  idx === 0 && styles.firstRow,
                  idx === 1 && styles.secondRow,
                  idx === 2 && styles.thirdRow,
                ]}
              >
                <Text style={styles.rank}>{idx + 1}.</Text>
                <Text style={styles.name}>{entry.name || 'Anonymous'}</Text>
                <Text style={styles.score}>{entry.score}</Text>
              </View>
            ))
          )}
          <TouchableOpacity style={styles.button} onPress={onClose}>
            <Text style={styles.buttonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(30,30,60,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    width: width * 0.85,
    backgroundColor: 'linear-gradient(135deg, #fffbe6 0%, #ffe0b2 100%)',
    borderRadius: 24,
    padding: 28,
    alignItems: 'center',
    elevation: 12,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
  },
  header: {
    alignItems: 'center',
    marginBottom: 10,
  },
  trophy: {
    width: 48,
    height: 48,
    marginBottom: 4,
    tintColor: '#ff9800',
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#ff9800',
    textShadowColor: '#fff3e0',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
    marginBottom: 10,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fffbe6',
    borderRadius: 12,
    marginVertical: 4,
    paddingVertical: 8,
    paddingHorizontal: 16,
    width: width * 0.7,
    justifyContent: 'space-between',
    elevation: 2,
  },
  firstRow: {
    backgroundColor: '#ffe082',
    borderWidth: 2,
    borderColor: '#ffd600',
  },
  secondRow: {
    backgroundColor: '#e0e0e0',
    borderWidth: 2,
    borderColor: '#bdbdbd',
  },
  thirdRow: {
    backgroundColor: '#ffe0b2',
    borderWidth: 2,
    borderColor: '#ffb300',
  },
  rank: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ff9800',
    width: 32,
    textAlign: 'center',
  },
  name: {
    fontSize: 18,
    color: '#333',
    flex: 1,
    textAlign: 'left',
    marginLeft: 8,
  },
  score: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4caf50',
    width: 50,
    textAlign: 'right',
  },
  empty: {
    fontSize: 16,
    color: '#888',
    marginBottom: 12,
    marginTop: 16,
  },
  button: {
    marginTop: 28,
    backgroundColor: '#ff9800',
    paddingVertical: 12,
    paddingHorizontal: 40,
    borderRadius: 24,
    elevation: 4,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 18,
    letterSpacing: 1,
  },
});

export default Leaderboard;