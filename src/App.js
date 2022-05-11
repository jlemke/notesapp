import './App.css';
import { InfoBar } from './InfoBar';

import React, { 
  useEffect, 
  useReducer 
} from 'react';

import { API } from 'aws-amplify';

import { List, Input, Button } from 'antd';
import { CheckOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import 'antd/dist/antd.css';

import { v4 as uuid } from 'uuid';

import { listNotes } from './graphql/queries';
import {
  createNote as CreateNote,
  deleteNote as DeleteNote,
  updateNote as UpdateNote
} from './graphql/mutations';
import { 
  onCreateNote,
  onDeleteNote,
  onUpdateNote
} from './graphql/subscriptions';



const CLIENT_ID = uuid();
const MAX_NOTES = 25;

const initialState = {
  notes: [],
  loading: true,
  error: false,
  form: {
    name: '',
    description: '' 
  }
};


const reducer = (state, action) => {
  switch(action.type) {

    case 'SET_NOTES':
      return { 
        ...state, 
        notes: action.notes, 
        loading: false 
      };

    case 'ADD_NOTE':
      return { 
        ...state, 
        notes: [
          action.note, 
          ...state.notes
        ]
      };

    case 'DELETE_NOTE':
      return {
        ...state,
        notes: state.notes.filter(n => n.id !== action.note.id)
      };

    case 'UPDATE_NOTE':
      return {
        ...state,
        notes: state.notes.map(n => n.id === action.note.id ? action.note : n)
      };

    case 'RESET_FORM':
      return {
        ...state, 
        form: initialState.form 
      };

    case 'SET_INPUT':
      return { 
        ...state,
        form: { 
          ...state.form,
          [action.name]: action.value 
        }
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

  const fetchNotes = async () => {
    try {
      const notesData = await API.graphql({
        query: listNotes
      });

      let notes = notesData.data.listNotes.items;
      console.log('Fetched ' + notes.length + ' notes from server.');

      // Sort notes by date descending
      dispatch({ 
        type: 'SET_NOTES',
        notes: notes.sort((a, b) => 
          Date.parse(a.createdAt) < Date.parse(b.createdAt) ? 1 : -1
        )
      });
    }
    catch (err) {
      console.log('error: ', err);
      dispatch({ 
        type: 'ERROR'
      });
    }
  };

  const createNote = async () => {

    // Destructuring
    const { form } = state;

    // Simple validation
    if (!form.name || !form.description) {
      return alert('please enter a name and description');
    }

    // Prevent too many notes being added to database.
    if (state.notes.length >= MAX_NOTES) {
      return alert('Max number of notes reached: ' + MAX_NOTES);
    }

    const note = { 
      ...form, 
      clientId: CLIENT_ID, 
      completed: false, 
      id: uuid() 
    };

    dispatch({ 
      type: 'RESET_FORM'
    });

    try {
      await API.graphql({
        query: CreateNote,
        variables: { 
          input: note 
        }
      })
      console.log('successfully created note!');
    } 
    catch (err) {
      console.error("error: ", err);
    }
    
  };

  const deleteNote = async (noteToDelete) => {

    // Tell the api to delete the note with given ID
    try {
      await API.graphql({
        query: DeleteNote,
        variables: { 
          input: { 
            id: noteToDelete.id
          } 
        }
      });

      console.log('successfully deleted note!');
    }
    catch (err) {
      console.error({ err });
    }
  };

  const updateNote = async (noteToUpdate) => {

    // Call api to update note
    try {
      await API.graphql({
        query: UpdateNote,
        variables: {
          input: { 
            id: noteToUpdate.id,
            completed: !noteToUpdate.completed
          }
        }
      });

      console.log('successfully updated note.');
    }
    catch (err) {
      console.error({ err });
    }
  };

  const onChange = (e) => {
    dispatch({ 
      type: 'SET_INPUT',
      name: e.target.name,
      value: e.target.value 
    });
  };

  const addExclamation = (note) => {
    dispatch({
      type: "UPDATE_NOTE",
      note: {
        ...note,
        name: note.name + "!"
      }
    });

    // And then we DON'T send to the API
  };



  useEffect(
    () => {
      fetchNotes();

      const onCreateSubscription = API.graphql({
        query: onCreateNote
      }).subscribe({
        next: noteData => {
          const note = noteData.value.data.onCreateNote;

          //if (CLIENT_ID === note.clientId) return;

          console.log('A new note was created by a client.');
          dispatch({ type: 'ADD_NOTE', note});
        }
      });


      const onDeleteSubscription = API.graphql({
        query: onDeleteNote
      }).subscribe({
        next: noteData => {

          const note = noteData.value.data.onDeleteNote;
          console.log('Note deleted by a client; note id: ' + note.id);

          dispatch({ 
            type: 'DELETE_NOTE', 
            note: note
          });
        }
      });


      const onUpdateSubscription = API.graphql({
        query: onUpdateNote
      }).subscribe({
        next: noteData => {

          const note = noteData.value.data.onUpdateNote;
          console.log('Note updated by a client; note id: ' + note.id);

          dispatch({
            type: 'UPDATE_NOTE',
            note: note
          });
        }
      });

      // Return a cleanup function
      return () => {
        onCreateSubscription.unsubscribe();
        onDeleteSubscription.unsubscribe();
        onUpdateSubscription.unsubscribe();
      }
    }, []
  );


  // List generating JSX
  const renderItem = (item) => {
    return (
      <List.Item 
        style={styles.item}
        actions={[
          <a style={styles.delete} 
            onClick={() => deleteNote(item)}
          >
            Delete
          </a>,
          <a style={styles.a}
            onClick={() => updateNote(item)}
          >
            {item.completed ? 'Unmark' : 'Mark Complete'}
          </a>,
          <a style={styles.addExclamation}
            onClick={() => addExclamation(item)}
          >
            Add <ExclamationCircleOutlined />
          </a>
        ]}
      >
        
        <List.Item.Meta
          title={
          <>
            {item.name}
            {item.completed && 
              <div style={styles.completed}>
                <CheckOutlined /> Complete
              </div>
            }
          </>}
          description={item.description}
        />
        
      </List.Item>
    )
  };



  // Main JSX
  return (
    <div style={styles.container}>
      <InfoBar notes={state.notes} />
      <Input
        onChange={onChange}
        value={state.form.name}
        placeholder="Enter note name"
        name='name'
        style={styles.input}
      />
      <Input
        onChange={onChange}
        value={state.form.description}
        placeholder="Enter note description..."
        name='description'
        style={styles.input}
      />
      <Button
        onClick={createNote}
        disabled={state.notes.length >= MAX_NOTES}
        type="primary"
      >
        Create Note
      </Button>
      {state.notes.length >= MAX_NOTES && 
        <div style={styles.maxNotes}>Maximum number of notes reached. ({MAX_NOTES})</div>}
      <List
        loading={state.loading}
        dataSource={state.notes}
        renderItem={renderItem}
      />
    </div>
  );
};


const styles = {
  container: {
    padding: 20
  },

  input: {
    marginBottom: 10
  },

  item: {
    textAlign: 'left' 
  },

  p: {
    color: '#1890ff' 
  },

  delete: {
    color: '#ff0000'
  },
  completed: {
    display: 'inline-block',
    paddingLeft: 10,
    color: '#15E324'
  },
  maxNotes: {
    display: "inline-block",
    paddingLeft: 16
  }
};

export default App;
