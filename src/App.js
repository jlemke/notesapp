import logo from './logo.svg';
import './App.css';
import React, { useEffect, useReducer } from 'react';
import { API } from 'aws-amplify';
import { List } from 'antd';
import 'antd/dist/antd.css';
import { listNotes } from './graphql/queries';



const initialState = {
  notes: [],
  loading: true,
  error: false,
  form: { name: '', description: '' }
};

const reducer = (state, action) => {
  switch(action.type) {

    case 'SET_NOTES':
      return { 
        ...state, 
        notes: action.notes, 
        loading: false 
      };

    case 'ERROR':
      return { 
        ...state, 
        loading: false, 
        error: true 
      };

    default:
      return { 
        ...state
      };
  }
};



const App = () => {

  const [state, dispatch] = useReducer(reducer, initialState);

  const fetchNotes = () => {
    try {
      const notesData = await API.graphql({
        query: listNotes
      });

      dispatch({ 
        type: 'SET_NOTES',
        notes: notesData.data.listNotes.items
      });
    } 
    catch (err) {
      console.log('error: ', err);
      dispatch({ 
        type: 'ERROR'
      });
    }
  };

  useEffect(
    () => {
      fetchNotes();
    }, []
  );

  return (
    <div style={styles.container}>
      <List
        loading={state.loading}
        dataSource={state.notes}
        renderItem={renderItem}
      />
    </div>
  );
};

export default App;
