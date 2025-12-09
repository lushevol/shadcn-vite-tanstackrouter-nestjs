import pandas as pd
import numpy as np
from sklearn.ensemble import IsolationForest
import joblib
import time
from datetime import datetime, timedelta
import matplotlib.pyplot as plt
from elasticsearch import Elasticsearch

class RealTimeAnomalyDetector:
    def __init__(self, window_size=100, contamination=0.05):
        """
        :param window_size: How many past data points to keep for retraining (The "Trend" memory)
        :param contamination: Expected percentage of anomalies
        """
        self.window_size = window_size
        self.contamination = contamination
        self.model = None
        self.data_window = [] # Sliding window storage
        self.features = ['request_count', 'avg_latency', 'error_rate']
        
    def train(self, historical_data):
        """
        Trains the model on available history.
        """
        print(f"[System] Retraining model on last {len(historical_data)} points to capture recent trends...")
        self.model = IsolationForest(contamination=self.contamination, random_state=42)
        self.model.fit(historical_data[self.features])
        
        # In a real app, save the model to disk
        # joblib.dump(self.model, 'current_model.pkl')

    def update_and_predict(self, new_data_point):
        """
        1. Adds new point to window.
        2. Retrains if window is full (simulating trend adaptation).
        3. Predicts if the new point is anomalous.
        """
        # Convert dict to DataFrame for the model
        df_point = pd.DataFrame([new_data_point])
        
        # 1. Prediction (Using the CURRENT model)
        if self.model is None:
            # Cold start: If no model exists, assume normal until we have enough data
            prediction = 1 
            score = 0.0
        else:
            prediction = self.model.predict(df_point[self.features])[0]
            score = self.model.decision_function(df_point[self.features])[0]

        # 2. Update Sliding Window (The Trend Logic)
        self.data_window.append(new_data_point)
        
        # Maintain fixed window size (remove old trends)
        if len(self.data_window) > self.window_size:
            self.data_window.pop(0)
            
        # 3. Trigger Retraining
        # In production, you might retrain every hour, not every single point.
        # Here we check if we have enough data to train for the first time
        if self.model is None and len(self.data_window) >= 50:
            df_history = pd.DataFrame(self.data_window)
            self.train(df_history)

        return prediction, score

class MockElasticsearch:
    """
    Simulates Elasticsearch behavior for testing/demo purposes.
    Generates synthetic data on the fly.
    """
    def __init__(self):
        self.current_time = datetime.now() - timedelta(days=7)
        self.t = 0
        print("[System] Using Mock Elasticsearch (Simulation Mode)")

    def search(self, index, body, size=10):
        # Simulate processing time
        time.sleep(0.5)
        
        hits = []
        for _ in range(size):
            # Simulate a gradual trend: Traffic increases by 0.5 requests every tick
            trend_factor = self.t * 0.5 
            
            # Normal Traffic pattern
            requests = 1000 + trend_factor + np.random.normal(0, 50)
            latency = 50 + (trend_factor * 0.01) + np.random.normal(0, 5)
            errors = np.random.randint(0, 5)

            # Inject Anomalies randomly
            is_anomaly = False
            if np.random.random() > 0.95: # 5% chance of anomaly
                type_anomaly = np.random.choice(['spike', 'crash'])
                if type_anomaly == 'spike':
                    requests = requests * 3  # DDoS
                    latency = latency + 100
                    is_anomaly = True
                elif type_anomaly == 'crash':
                    errors = 500  # DB Crash
                    is_anomaly = True
            
            doc = {
                '_source': {
                    'timestamp': self.current_time.isoformat(),
                    'request_count': requests,
                    'avg_latency': latency,
                    'error_rate': errors,
                    'is_actual_anomaly': is_anomaly
                }
            }
            hits.append(doc)
            
            # Increment time
            self.current_time += timedelta(hours=1)
            self.t += 1

        return {'hits': {'hits': hits}}

class ESReader:
    def __init__(self, host='localhost', port=9200, index='traffic-logs'):
        self.index = index
        self.last_timestamp = None
        self.mock_mode = False
        
        try:
            self.es = Elasticsearch([{'host': host, 'port': port, 'scheme': 'http'}])
            if not self.es.ping():
                raise Exception("Ping failed")
            print(f"[System] Connected to Elasticsearch at {host}:{port}")
        except Exception as e:
            print(f"[System] Could not connect to Elasticsearch: {e}")
            print("[System] Switching to Mock Elasticsearch...")
            self.es = MockElasticsearch()
            self.mock_mode = True

    def fetch_new_data(self):
        """
        Fetches data points newer than the last seen timestamp.
        """
        query = {
            "sort": [{"timestamp": "asc"}],
            "query": {"match_all": {}}
        }
        
        if self.last_timestamp and not self.mock_mode:
            query["query"] = {
                "range": {
                    "timestamp": {
                        "gt": self.last_timestamp
                    }
                }
            }
            
        try:
            # Fix for DeprecationWarning: use 'size' as kwarg, not in body if using client helper
            # But standard search accepts size as param
            res = self.es.search(index=self.index, body=query, size=10) 
            hits = res['hits']['hits']
            data_points = []
            for hit in hits:
                source = hit['_source']
                data_points.append(source)
                self.last_timestamp = source['timestamp']
            return data_points
        except Exception as e:
            print(f"[System] Error reading from ES: {e}")
            return []

def visualize_results(results):
    if not results:
        print("No results to visualize.")
        return

    df = pd.DataFrame(results)
    # Ensure timestamp is datetime for plotting
    df['timestamp'] = pd.to_datetime(df['timestamp'])
    
    fig, (ax1, ax2, ax3) = plt.subplots(3, 1, figsize=(12, 10), sharex=True)
    
    ax1.plot(df['timestamp'], df['request_count'], label='Request Count', color='blue')
    anomalies = df[df['prediction'] == -1]
    ax1.scatter(anomalies['timestamp'], anomalies['request_count'], color='red', label='Anomaly', zorder=5)
    ax1.set_ylabel('Requests')
    ax1.set_title('Traffic Volume & Anomalies')
    ax1.legend()
    ax1.grid(True, alpha=0.3)

    ax2.plot(df['timestamp'], df['avg_latency'], label='Avg Latency (ms)', color='orange')
    ax2.scatter(anomalies['timestamp'], anomalies['avg_latency'], color='red', zorder=5)
    ax2.set_ylabel('Latency (ms)')
    ax2.legend()
    ax2.grid(True, alpha=0.3)

    ax3.plot(df['timestamp'], df['error_rate'], label='Error Rate', color='green')
    ax3.scatter(anomalies['timestamp'], anomalies['error_rate'], color='red', zorder=5)
    ax3.set_ylabel('Errors')
    ax3.set_xlabel('Time')
    ax3.legend()
    ax3.grid(True, alpha=0.3)

    plt.tight_layout()
    plt.savefig('anomaly_detection_results.png')
    print("\n[System] Visualization saved to 'anomaly_detection_results.png'")

if __name__ == "__main__":
    detector = RealTimeAnomalyDetector(window_size=100)
    reader = ESReader()
    
    print("Starting Real-Time Anomaly Detector (Reading from Elasticsearch)...")
    print(f"{'TIME':<20} | {'REQ':<6} | {'LATENCY':<8} | {'ERR':<5} | {'STATUS':<10} | {'SCORE':<8}")
    print("-" * 80)

    results = []
    processed_count = 0
    
    try:
        while True:
            new_data = reader.fetch_new_data()
            
            if not new_data:
                time.sleep(1) # Wait for new data
                continue
                
            for data_point in new_data:
                pred, score = detector.update_and_predict(data_point)
                
                # Store result
                result_entry = data_point.copy()
                result_entry['prediction'] = int(pred)
                result_entry['score'] = float(score)
                results.append(result_entry)
                
                # Console Output
                status = "OK"
                color_code = "\033[92m" # Green
                if pred == -1:
                    status = "ANOMALY"
                    color_code = "\033[91m" # Red
                elif detector.model is None:
                    status = "LEARNING"
                    color_code = "\033[93m" # Yellow

                t_str = data_point['timestamp'].replace('T', ' ')[:16]
                print(f"{color_code}{t_str:<20} | {data_point['request_count']:<6.0f} | {data_point['avg_latency']:<8.1f} | {data_point['error_rate']:<5} | {status:<10} | {score:.3f}\033[0m")
                
                processed_count += 1
                
                # Periodic Retraining
                if processed_count > 0 and processed_count % 50 == 0:
                    df_curr = pd.DataFrame(detector.data_window)
                    detector.train(df_curr)
            
            # Stop condition for demo purposes (optional, or remove to run forever)
            if processed_count > 200:
                print("\n[System] Processed 200 points. Stopping for demo.")
                break
                
            time.sleep(0.5)

        visualize_results(results)

    except KeyboardInterrupt:
        print("\nMonitoring stopped.")
        visualize_results(results)