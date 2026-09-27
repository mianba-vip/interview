package interview.homegrown.common.observability;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.Map;

/** Model prices are deliberately operator-managed: unknown prices must not produce invented costs. */
@Component
@ConfigurationProperties(prefix = "app.observability")
public class ObservabilityProperties {
    private Map<String, ModelPrice> modelPrices = new HashMap<>();

    public Map<String, ModelPrice> getModelPrices() {
        return modelPrices;
    }

    public void setModelPrices(Map<String, ModelPrice> modelPrices) {
        this.modelPrices = modelPrices;
    }

    public static class ModelPrice {
        private double inputUsdPerMillion;
        private double outputUsdPerMillion;

        public double getInputUsdPerMillion() {
            return inputUsdPerMillion;
        }

        public void setInputUsdPerMillion(double inputUsdPerMillion) {
            this.inputUsdPerMillion = inputUsdPerMillion;
        }

        public double getOutputUsdPerMillion() {
            return outputUsdPerMillion;
        }

        public void setOutputUsdPerMillion(double outputUsdPerMillion) {
            this.outputUsdPerMillion = outputUsdPerMillion;
        }
    }
}
