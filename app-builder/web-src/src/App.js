import React from 'react';
import {
  Heading,
  View,
  Content,
  Flex,
} from '@adobe/react-spectrum';

function App() {
  return (
    <View padding="size-400">
      <Flex direction="column" gap="size-200">
        <Heading level={1}>QSR — App Builder Admin</Heading>
        <Content>
          <p>
            This is the App Builder Web UI for the Quick Service Restaurant
            programme. Use this dashboard to manage App Builder actions,
            monitor webhook events, and trigger sitemap generation.
          </p>
        </Content>
      </Flex>
    </View>
  );
}

export default App;
