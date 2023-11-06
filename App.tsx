import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, Text, TouchableOpacity, View, Platform, Dimensions, TextInput } from 'react-native';
import { LightSensor } from 'expo-sensors';
import { LineChart } from 'react-native-chart-kit';

const MAX_DATA_POINTS = 30; // Maximum number of data points to display (2 minutes with a data point every second). If it starts being laggy when too many datapoints are shown, modify this to a smaller value.
const max_solar_illuminance = 128000; // Maximum illuminance of the sun, this is defined by the solar illuminance constant

const App: React.FC = () => {
  const [luxData, setLuxData] = useState<number[]>([]); // Initialize luxData with an empty array
  const _subscription = useRef<ReturnType<typeof LightSensor.addListener> | null>(null); // Initialize _subscription as null
  // Without a useRef, the `_toggle` function is not properly unsubscribing from the LightSensor listener when `_subscription` is not null. This could be due to the `_subscription` variable being reinitialized on every render, thus losing its reference to the actual subscription.
  // To fix this, we need to use `useRef` hook to persist the `_subscription` across multiple renders.
  // In this code, `_subscription` is a mutable ref object. When you call `_unsubscribe`, it will correctly remove the current subscription. This should prevent the memory leak you were experiencing.

  const [maxDataPoints, setMaxDataPoints] = useState(MAX_DATA_POINTS);
  const [newMaxDataPoints, setNewMaxDataPoints] = useState(MAX_DATA_POINTS.toString());
  const [toggleButtonText, setToggleButtonText] = useState('Stop');

  useEffect(() => {
    /** Subscribe to LightSensor updates when component mounts */
    _toggle();

    return () => {
      _unsubscribe();
    };
  }, []);

  const _toggle = () => {
    /** Toggle the state of the LightSensor listener */

    // If _subscription.current is not null, we are already listening for updates, so we unsubscribe
    if (_subscription.current) {
      _unsubscribe();
    } else {
      _subscribe();
    }
  };

  const _subscribe = () => {
    /** Subscribe to LightSensor updates */
    // Start listening for updates of lux sensor
    _subscription.current = LightSensor.addListener(async (newData) => {
      // Update luxData with new data point
      await setLuxData((prevData) => {
        console.log(maxDataPoints + ` and ` + prevData.length)  // debuglines
        if (prevData.length >= maxDataPoints) {  // if array is too big, we slice it down to maxDataPoints
          return [...prevData.slice(1), newData.illuminance];
        } else {  // otherwise, we just add the new data point, extending by one the array's total size
          return [...prevData, newData.illuminance];
        }
      });
    });
    // Change Toggle's button text to "Stop"
    setToggleButtonText('Stop');
  };

  const _unsubscribe = () => {
    /** Unsubscribe from LightSensor updates */
    // Stop listening for updates of lux sensor by removing the listener
    _subscription.current?.remove();  // equivalent to: _subscription.current && _subscription.current.remove();
    _subscription.current = null;
    // Change the state of luxData to an empty array
    setLuxData([]);
    // Change Toggle's button text to "Start"
    setToggleButtonText('Start');
  };

  const handleInputChangeMaxDataPoints = (text: string) => {
    /** Handle input change of maxDataPoints */
    setNewMaxDataPoints(text);
  };

  const handleUpdateMaxDataPoints = () => {
    /** Handle update of maxDataPoints */
    const newMaxDataPointsValue = parseInt(newMaxDataPoints, 10);
    if (!isNaN(newMaxDataPointsValue) && newMaxDataPointsValue >= 1) {
      // If new size is valid (not null and strictly positve), set new value into maxDataPoints and reslice luxData array
      setMaxDataPoints(newMaxDataPointsValue);  // to limit future growth
      resizeLuxData();  // to slice down now if array is too big given new size
    }
  };

  const resizeLuxData = () => {
    /** Resize luxData array to maxDataPoints */
    setLuxData((prevData) => {
      if (prevData.length > maxDataPoints) {
        // If maxDataPoints is shorter than luxData current size, we resize down by slicing
        return prevData.slice(prevData.length - maxDataPoints);
        // Otherwise, if greater or equal, it will be managed directly in the if condition in _subscribe()
      } else {
        return prevData;
      }
    });
  };

  // Display components
  interface LuxSettingsProps {
    debug?: boolean;  // debug is an optional boolean prop, default value is false
  }
  const LuxSettings = ({ debug = false }: LuxSettingsProps) => {
    /** Display the settings for the lux sensor data collection */
    return (
      <>
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={newMaxDataPoints}
          onChangeText={handleInputChangeMaxDataPoints}
          keyboardType="numeric"
        />
        <TouchableOpacity onPress={handleUpdateMaxDataPoints} style={styles.updateButton}>
          <Text>Update Max Data Points</Text>
        </TouchableOpacity>
      </View>
      { ( !debug? null :  // if debug is false or undefined (default value is false), we don't display the debug data (for example, when we are not in debug mode)
      <Text>DEBUG DATA: {`\n`} Max Data Points: {maxDataPoints} {`\n`} luxData.length: {luxData.length}</Text>
      ) }
      <View style={styles.buttonContainer}>
        <TouchableOpacity onPress={_toggle} style={styles.button}>
          <Text>{toggleButtonText}</Text>
        </TouchableOpacity>
      </View>
      </>
    )
  }

  const LuxChart = () => {
    /** Display a chart of the historical values of the luxData array */
    return (
      <LineChart
        data={{
          labels: luxData.map((_, index) => (index % 10 === 0 ? index.toString() : '')),
          datasets: [
            { data: luxData, }, // actual data
            { data: [0] }, // min
            //{ data: [max_solar_illuminance] }, // max
          ],
        }}
        width={Dimensions.get('window').width}
        height={200}
        yAxisLabel="lux "
        chartConfig={{
          backgroundGradientFrom: '#fff',
          backgroundGradientTo: '#fff',
          decimalPlaces: 0,
          color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
        }}
      />
    )
  }

  // Main display
  return (
    <View style={styles.sensor}>
      { Platform.OS !== 'android' ? <Text>`Only available on Android`</Text> : (  // LightSensor is only available on Android
        <>
        {
          (luxData?.length === 0) ? (  // if array is empty, then react-native-chart-kit will fail, so the app will always crash at startup without checking explicitly https://stackoverflow.com/questions/71082961/unable-to-use-dynamic-data-into-react-native-chart-kit
            <Text>No chart data to display!</Text>
          ) : (  // otherwise, on Android, we can display the chart
            <View>
              <Text>Light Sensor:</Text>
              <Text>
                Illuminance: {luxData.slice(-1)} lux
              </Text>
              <LuxChart />
            </View>
          )
        }
        <LuxSettings debug={true} />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 15,
  },
  input: {
    flex: 1,
    borderColor: 'gray',
    borderWidth: 1,
    padding: 10,
  },
  updateButton: {
    backgroundColor: '#eee',
    padding: 10,
  },
  buttonContainer: {
    flexDirection: 'row',
    alignItems: 'stretch',
    marginTop: 15,
  },
  button: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#eee',
    padding: 10,
  },
  sensor: {
    marginTop: 45,
    paddingHorizontal: 10,
  },
});

export default App;  // Define component App as the entry point of the app