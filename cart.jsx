const { useState, useEffect, useReducer } = React;

const useDataApi = (initialUrl, initialData) => {
  const [url, setUrl] = useState(initialUrl);

  const [state, dispatch] = useReducer(dataFetchReducer, {
    isLoading: false,
    isError: false,
    data: initialData,
  });
  console.log(`useDataApi called`);
  useEffect(() => {
    console.log("useEffect Called");
    let didCancel = false;
    const fetchData = async () => {
      dispatch({ type: "FETCH_INIT" });
      try {
        const result = await axios(url);
        console.log("FETCH FROM URl");
        if (!didCancel) {
          dispatch({ type: "FETCH_SUCCESS", payload: result.data });
        }
      } catch (error) {
        if (!didCancel) {
          dispatch({ type: "FETCH_FAILURE" });
        }
      }
    };
    fetchData();
    return () => {
      didCancel = true;
    };
  }, [url]);
  return [state, setUrl];
};
const dataFetchReducer = (state, action) => {
  switch (action.type) {
    case "FETCH_INIT":
      return {
        ...state,
        isLoading: true,
        isError: false,
      };
    case "FETCH_SUCCESS":
      return {
        ...state,
        isLoading: false,
        isError: false,
        data: action.payload,
      };
    case "FETCH_FAILURE":
      return {
        ...state,
        isLoading: false,
        isError: true,
      };
    default:
      throw new Error();
  }
};

const Products = () => {
  const [items, setItems] = React.useState([]);
  const [cart, setCart] = React.useState([]);
  const [total, setTotal] = React.useState(0);
  const { Card, Accordion, Button, Container, Row, Col, Image, Input } =
    ReactBootstrap;
  const { Fragment, useState, useEffect, useReducer } = React;
  const [query, setQuery] = useState("http://localhost:1337/products");
  const [{ data, isLoading, isError }, doFetch] = useDataApi(
    "http://localhost:1337/products",
    {
      data: [],
    }
  );
  console.log(`Rendering Products ${JSON.stringify(data)}`);

  // Fetch Products Data from Strapi DB
  useEffect(async () => {
    const dataFetched = await fetch(query);
    const data = await dataFetched.json();
    setItems(data);
  }, []);

// add products to Cart when clicked  
  const addToCart = (e) => {
    let name = e.target.name;
    let item = items.filter((item) => item.name == name);
    if (item[0].stock == 0) return;
    item[0].stock = item[0].stock - 1;
    console.log(`add to Cart ${JSON.stringify(item)}`);
    setCart([...cart, ...item]);
  };
  
// this is the index in the cart not in the Product List
  const deleteCartItem = (delIndex) => { 
    let newCart = cart.filter((item, i) => delIndex != i);
    let target = cart.filter((item, index) => delIndex == index);
    let newItems = items.map((item, index) => {
      if (item.name == target[0].name) item.stock = item.stock + 1;
      return item;
    });
    setCart(newCart);
    setItems(newItems);
  };

// setup url for fetching random products images & render with listed products on front end
  let list = items.map((item, index) => {
    let n = index + 1049 + Math.floor(Math.random() * 10);
    let url = "https://picsum.photos/id/" + n + "/50/50";

    return (
      <li key={index}>
        <Image src={url} width={70} roundedCircle></Image>
        <Button variant='primary' size='large' >
          {item.name} ${item.cost} : {item.stock} units available
        </Button>
        <input name={item.name} value="Buy" type='submit' onClick={addToCart}></input>
      </li>
    );
  });

// rendering products in the front end with the Card component once added to cart
  let cartList = cart.map((item, index) => {
    return (
      <Card key={index}>
        <Card.Header>
          <Accordion.Toggle as={Button} variant='link' eventKey={1 + index}>
            {item.name}
          </Accordion.Toggle>
        </Card.Header>
        <Accordion.Collapse
          onClick={() => deleteCartItem(index)}
          eventKey={1 + index}
          value="Remove"
        >
          <Card.Body>
            $ {item.cost} from {item.country}
          </Card.Body>
        </Accordion.Collapse>
      </Card>
    );
  });

  // checkout rendering
  let finalList = () => {
    let total = checkOut();
    let final = cart.map((item, index) => {
      return (
        <div key={index} index={index}>
          {item.name}
        </div>
      );
    });
    return { final, total };
  };
  
  //checkout processing
  const checkOut = () => {
    let costs = cart.map((item) => item.cost);
    const reducer = (accum, current) => accum + current;
    let newTotal = costs.reduce(reducer, 0);
    console.log(`total updated to ${newTotal}`);
    //cart.map((item, index) => deleteCartItem(index));
    return newTotal;
  };

  //products restock using doFetch helper function
  const restockProducts = (url) => {
    doFetch(url);
    let newItems = data.map((item) => {
      let { name, country, cost, stock } = item;
      return { name, country, cost, stock };
    });
    setItems([...items, ...newItems]);
  };

  // front end 
  return (
    <Container>
      <Row>
        <Col className="products">
          <h1>Product for Sale</h1>
          <ul style={{ listStyleType: "none" }}>{list}</ul>
        </Col>
        <Col className="cartProducts">
          <h1>In Your Cart</h1>
          <Accordion>{cartList}</Accordion>
        </Col>
        <Col className="checkout">
          <h1>CheckOut</h1>
          <Button onClick={checkOut}>CheckOut $ {finalList().total}</Button>
          <div> {finalList().total > 0 && finalList().final} </div>
        </Col>
      </Row>
      <Row>
        <form
          style={{height: 100, display:"flex", alignItems:"center"}}
          onSubmit={(event) => {
            restockProducts(`http://localhost:1337/${query}`);
            console.log(`Restock called on ${query}`);
            event.preventDefault();
          }}
        >
          <input
            type='text'
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <button type='submit'>ReStock Products</button>
        </form>
      </Row>
    </Container>
  );
};

ReactDOM.render(<Products />, document.getElementById("root"));
