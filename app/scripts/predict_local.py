import xgboost as xgb
import numpy as np

model = xgb.XGBRegressor()
model.load_model("model/xgboost-model.model")


X = np.array([[30, 28, 27]])
y_pred = model.predict(X)
print("Prediction:", y_pred[0])
