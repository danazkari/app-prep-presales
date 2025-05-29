import React, { useEffect, useState } from 'react';
import {
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  Card,
  CardMedia,
  CardContent,
  CardActions,
  Button,
  Modal,
  TextField,
  Box,
  Badge,
  Grid,
  Table,
  TableContainer,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Snackbar,
  type SnackbarCloseReason,
} from '@mui/material';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import CloseIcon from '@mui/icons-material/Close'
import { useQuery, useMutation } from '@apollo/client';
import { GET_PRODUCTS } from './queries';
import { CREATE_PURCHASE } from './mutations';
import { Receipt } from '@mui/icons-material';

// Types
interface Product {
  id: string;
  name: string;
  picture: {
    publicUrl: string
  };
  price: number;
}

interface CartItem {
  product: Product;
  quantity: number;
}

interface ReceiptItem {
  id: string
  status: string
  createdAt: string
  total: number
}

interface PurchaseFormData {
  studentName: string;
  phoneNumber: string;
  section: string;
}

const App: React.FC = () => {
  const { loading, error, data: getProductsData } = useQuery(GET_PRODUCTS)
  const [ createPurchase, { data: createdPurchase, loading: loadingPurchaseCreation } ] = useMutation(CREATE_PURCHASE)
  let products: Product[] = []
  if (!loading && !error) {
    products = getProductsData?.products
  }
  const storedCart = JSON.parse(localStorage.getItem('cart') || '[]')
  const [cart, setCart] = useState<CartItem[]>(storedCart)
  const [purchases, setPurchases] = useState<ReceiptItem[]>(JSON.parse(localStorage.getItem('purchases') || '[]'))
  const [openCart, setOpenCart] = useState(false)
  const [openPurchases, setOpenPurchases] = useState(false)
  const [formData, setFormData] = useState<PurchaseFormData>({
    studentName: '',
    phoneNumber: '',
    section: '',
  });
  const [openSnackbar, setOpenSnackbar] = useState(false)
  
  const handleSnackbarClose = (_: React.SyntheticEvent | Event, reason?: SnackbarCloseReason) => {
    if (reason === 'clickaway')
      return
    setOpenSnackbar(false)
  }

  useEffect(() => {
    if(createdPurchase) {
      const newPurchases = [...purchases, {...createdPurchase?.createPurchase, listItems: cart, total: totalPrice}]
      setPurchases(newPurchases)
      localStorage.setItem(
        'purchases',
        JSON.stringify(newPurchases)
      );
      setOpenSnackbar(true)
      setCart([]);
      localStorage.setItem('cart', '[]')
      setOpenCart(false);
      setFormData({ studentName: '', phoneNumber: '', section: '' });
    }
  }, [createdPurchase])
  const isPurchaseFormComplete: boolean = !(formData.phoneNumber && formData.studentName && formData.section && cart.length > 0)

  // Cart functions
  const addToCart = (product: Product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      let cart = [...prev]
      if (existing) {
        cart = prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      } else {
        cart = [...prev, { product, quantity: 1 }];
      }
      localStorage.setItem('cart', JSON.stringify(cart))
      return cart
    });
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => {
      const result = prev.filter((item) => item.product.id !== productId)
      localStorage.setItem('cart', JSON.stringify(result))
      return result
    })
  }

  const updateQuantity = (productId: string, quantity: number) => {
    setCart((prev) => {
      const result = prev.map((item) =>
        item.product.id === productId ? { ...item, quantity } : item
      )
      localStorage.setItem('cart', JSON.stringify(result))
      return result
    });
  };

  const handleFormChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const totalPrice = cart.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );

  const submitPurchase = async () => {
    try {
      createPurchase({
        variables: {
          data: {
            student: formData.studentName,
            phoneNumber: formData.phoneNumber,
            lineItems: {
              create: cart.map((item: CartItem) => ({
                product: { connect: { id: item.product.id } },
                quantity: item.quantity,
              }))
            }
          }
        }
      })
    } catch (error) {
      console.error('Error creating purchase: ', error)
    }
  };

  const getQuantityInCart = (productId: string): number => {
    const item = cart.find(item => item.product.id === productId)
    return item?.quantity || 0
  }

  return (
    <Box sx={{ width: '100vw' , height: '100vh', paddingTop: '64px' }}>
      <AppBar position="fixed">
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Reservas Talent Show 2025
          </Typography>
          <IconButton color="inherit" onClick={() => setOpenCart(true)}>
            <Badge badgeContent={cart.length} color="secondary">
              <ShoppingCartIcon />
            </Badge>
          </IconButton>
          <IconButton color="inherit" onClick={() => setOpenPurchases(true)}>
            <Badge badgeContent={purchases.length} color="secondary">
              <Receipt />
            </Badge>
          </IconButton>
        </Toolbar>
      </AppBar>
      <Grid container spacing={2} sx={{ p: 2, maxWidth: 1200, margin: '0 auto' }}>
        {products.length > 0 && products.map((product: Product) => (
          <Grid size={{ xs: 12, sm: 6, md: 4 }} key={product.id}>
            <Card>
              <CardMedia
                component="img"
                height="140"
                image={product.picture.publicUrl}
                alt={product.name}
              />
              <CardContent>
                <Typography sx={{
                  display: '-webkit-box',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  WebkitBoxOrient: 'vertical',
                  WebkitLineClamp: 2,
                  minHeight: '3em'
                }} gutterBottom variant="h5">
                  {product.name}
                </Typography>
                <Typography>
                  ₡{product.price.toLocaleString()}
                </Typography>
              </CardContent>
              <CardActions>
                <Button sx={{ position: 'relative' }} size="small" onClick={() => addToCart(product)}>
                  { getQuantityInCart(product.id) > 0 ? `Agregar (${getQuantityInCart(product.id)})` : 'Agregar' }
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>
      
      <Modal open={openPurchases} onClose={() => setOpenPurchases(false)}>
        <Box sx={{ p: 3, color: 'black', backgroundColor: 'white', minWidth: 400, maxWidth: 800, margin: '50px auto' }}>
          <Typography variant="h6">
            Compras Realizadas
          </Typography>
          <TableContainer>
            <Table sx={{minWidth: 375}}>
              <TableHead>
                <TableRow>
                  <TableCell>C&oacute;digo de Compra</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Total</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {purchases.map((item: ReceiptItem) => (
                  <TableRow key={item.id} sx={{ '&:last-child td, &:last-child th': {border: 0}}}>
                    <TableCell component="th" scope="row">{item.id}</TableCell>
                    <TableCell>{item.status}</TableCell>
                    <TableCell>₡{item.total.toLocaleString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      </Modal>

      <Modal open={openCart} onClose={() => setOpenCart(false)}>
        <Box sx={{ p: 3, color: 'black', backgroundColor: 'white', width: 400, margin: '50px auto' }}>
          <Typography variant="h6">Carrito De Compras</Typography>
          {cart.length === 0 && (
            <Typography align='center'>
              Sin productos en el carrito
            </Typography>
          )}
          {cart.map((item) => (
            <Box key={item.product.id} sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
              <img src={item.product.picture.publicUrl} alt={item.product.name} style={{ width: 40, height: 40, marginRight: 8 }} />
              <Typography sx={{
                flexGrow: 1
              }}>{item.product.name}</Typography>
              <TextField
                type="number"
                value={item.quantity}
                onChange={(e) => updateQuantity(item.product.id, parseInt(e.target.value))}
                inputProps={{ min: 1 }}
                size="small"
                sx={{ width: 60 }}
                disabled={loadingPurchaseCreation}
              />
              <Button disabled={loadingPurchaseCreation} onClick={() => removeFromCart(item.product.id)}>X</Button>
            </Box>
          ))}

          <Typography sx={{ mt: 2 }}>Total: ₡{totalPrice.toLocaleString()}</Typography>

          <Box sx={{ mt: 2 }}>
            <TextField disabled={loadingPurchaseCreation} label="Nombre del Estudiante" name="studentName" value={formData.studentName} onChange={handleFormChange} fullWidth sx={{ mb: 1 }} />
            <TextField disabled={loadingPurchaseCreation} label="N&uacute;mero del Tel&eacute;fono" name="phoneNumber" value={formData.phoneNumber} onChange={handleFormChange} fullWidth sx={{ mb: 1 }} />
            <TextField disabled={loadingPurchaseCreation} label="Secci&oacute;n" name="section" value={formData.section} onChange={handleFormChange} fullWidth sx={{ mb: 1 }} />

            <Button disabled={isPurchaseFormComplete || loadingPurchaseCreation} variant="contained" sx={{ mt: 2 }} onClick={submitPurchase} fullWidth>
              { loadingPurchaseCreation ? 'Enviando reserva...' : 'Hacer Reserva'}
            </Button>
          </Box>
        </Box>
      </Modal>
      <Snackbar
        open={openSnackbar}
        autoHideDuration={6000}
        message="🥳 Compra exitosa!"
        onClose={handleSnackbarClose}
        action={( <IconButton size="small" aria-label="close" color="inherit" onClick={handleSnackbarClose}><CloseIcon fontSize="small"/></IconButton> )}
      />
    </Box>
  );
};

export default App;
